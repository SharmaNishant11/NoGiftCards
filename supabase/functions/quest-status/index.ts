import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BROWSER_USE_API = "https://api.browser-use.com/api/v3";

function inferCurrentNode(messages: any[]): { currentNode: string; visitedNodes: string[] } {
  const visited: string[] = ["base"];
  let current = "base";
  const messageText = messages.map((m: any) => (m.summary || m.content || "").toLowerCase()).join(" ");
  
  if (messageText.includes("etsy")) { visited.push("etsy"); current = "etsy"; }
  if (messageText.includes("amazon")) { visited.push("amazon"); current = "amazon"; }
  if (messageText.includes("specialty") || messageText.includes("uncommon") || messageText.includes("food52")) { visited.push("specialty"); current = "specialty"; }
  if (messageText.includes("niche") || messageText.includes("specific")) { visited.push("niche"); current = "niche"; }
  
  return { currentNode: current, visitedNodes: [...new Set(visited)] };
}

// Clean raw agent output to human-readable text
function cleanAgentMessage(raw: string): string {
  if (!raw) return "";
  // Strip HTML tags
  let cleaned = raw.replace(/<[^>]*>/g, "");
  // Strip markdown code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "[code block]");
  // Strip inline code
  cleaned = cleaned.replace(/`[^`]+`/g, (match) => match.replace(/`/g, ""));
  // Strip JSON blobs longer than 100 chars
  cleaned = cleaned.replace(/\{[\s\S]{100,}\}/g, "[data]");
  // Strip very long URLs, keep short ones
  cleaned = cleaned.replace(/https?:\/\/\S{80,}/g, "[long URL]");
  // Collapse multiple whitespace/newlines
  cleaned = cleaned.replace(/\n{3,}/g, "\n").replace(/\s{3,}/g, " ").trim();
  // Truncate very long messages
  if (cleaned.length > 300) cleaned = cleaned.substring(0, 297) + "...";
  return cleaned;
}

// Try to extract product discoveries from intermediate messages
function extractDiscoveriesFromMessages(messages: any[]): any[] {
  const discoveries: any[] = [];
  const allText = messages.map((m: any) => m.summary || m.content || "").join("\n");
  
  // Look for JSON arrays in any message
  const jsonMatches = allText.match(/\[[\s\S]*?\]/g) || [];
  for (const match of jsonMatches) {
    try {
      const parsed = JSON.parse(match);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name && parsed[0].url) {
        discoveries.push(...parsed);
      }
    } catch { /* not valid JSON */ }
  }
  
  return discoveries;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const questId = url.searchParams.get("questId");
    if (!questId) {
      return new Response(JSON.stringify({ error: "questId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BROWSER_USE_API_KEY = Deno.env.get("BROWSER_USE_API_KEY");
    if (!BROWSER_USE_API_KEY) throw new Error("BROWSER_USE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: quest, error: questErr } = await supabase
      .from("quests")
      .select("*")
      .eq("id", questId)
      .single();

    if (questErr || !quest) {
      return new Response(JSON.stringify({ error: "Quest not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If already complete, return cached status
    if (quest.status === "complete" || quest.status === "error") {
      const { data: messages } = await supabase
        .from("quest_messages")
        .select("*")
        .eq("quest_id", questId)
        .order("created_at", { ascending: true });

      return new Response(JSON.stringify({
        questId: quest.id,
        status: quest.status,
        currentNode: quest.current_node,
        visitedNodes: quest.visited_nodes,
        liveUrl: quest.live_url,
        messages: messages || [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if quest has been running too long (10 min timeout)
    const questAge = Date.now() - new Date(quest.created_at).getTime();
    const MAX_QUEST_DURATION = 10 * 60 * 1000; // 10 minutes
    
    if (questAge > MAX_QUEST_DURATION) {
      // Force complete
      await supabase.from("quests").update({ status: "complete", updated_at: new Date().toISOString() }).eq("id", questId);
      
      // Parse any discoveries we can from existing messages
      const { data: existingMsgs } = await supabase.from("quest_messages").select("*").eq("quest_id", questId);
      
      const { data: messages } = await supabase
        .from("quest_messages")
        .select("*")
        .eq("quest_id", questId)
        .order("created_at", { ascending: true });

      return new Response(JSON.stringify({
        questId: quest.id, status: "complete",
        currentNode: "alchemy", visitedNodes: [...(quest.visited_nodes || []), "alchemy"],
        liveUrl: quest.live_url, messages: messages || [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Poll Browser Use session
    const buResponse = await fetch(`${BROWSER_USE_API}/sessions/${quest.session_id}`, {
      headers: { "X-Browser-Use-API-Key": BROWSER_USE_API_KEY },
    });

    if (!buResponse.ok) {
      console.error("Browser Use poll error:", buResponse.status);
      throw new Error("Failed to poll Browser Use session");
    }

    const buSession = await buResponse.json();

    // Get live messages from Browser Use
    const msgResponse = await fetch(`${BROWSER_USE_API}/sessions/${quest.session_id}/messages`, {
      headers: { "X-Browser-Use-API-Key": BROWSER_USE_API_KEY },
    });

    let buMessages: any[] = [];
    if (msgResponse.ok) {
      const msgData = await msgResponse.json();
      buMessages = msgData.messages || msgData || [];
    }

    const { currentNode, visitedNodes } = inferCurrentNode(buMessages);

    // Determine quest status
    const buStatus = buSession.status?.value || buSession.status || "running";
    let questStatus = "running";
    if (buStatus === "idle" || buStatus === "stopped" || buStatus === "completed" || buStatus === "finished") {
      questStatus = "complete";
      visitedNodes.push("alchemy");
    } else if (buStatus === "error" || buStatus === "timed_out" || buStatus === "failed") {
      questStatus = "complete"; // treat errors as complete so UI stops spinning
    }

    // Sync new messages to DB (cleaned)
    const { data: existingMsgs } = await supabase
      .from("quest_messages")
      .select("summary")
      .eq("quest_id", questId);

    const existingSummaries = new Set((existingMsgs || []).map((m: any) => m.summary));

    const newMessages = buMessages
      .filter((m: any) => {
        const summary = m.summary || m.content || "";
        if (!summary) return false;
        const cleaned = cleanAgentMessage(summary);
        if (!cleaned || cleaned.length < 5) return false;
        return !existingSummaries.has(`> ${cleaned}`);
      })
      .map((m: any) => ({
        quest_id: questId,
        role: m.role || "agent",
        summary: `> ${cleanAgentMessage(m.summary || m.content || "")}`,
      }));

    if (newMessages.length > 0) {
      await supabase.from("quest_messages").insert(newMessages);
    }

    // Update quest record
    await supabase.from("quests").update({
      status: questStatus,
      current_node: currentNode,
      visited_nodes: visitedNodes,
      updated_at: new Date().toISOString(),
    }).eq("id", questId);

    // Try to extract and store discoveries incrementally from messages AND from output
    const outputText = buSession.output || "";
    const allText = [...buMessages.map((m: any) => m.summary || m.content || ""), outputText].join("\n");
    
    // Check if we have new discoveries to parse
    const { data: existingDisc } = await supabase
      .from("discoveries")
      .select("name")
      .eq("quest_id", questId);
    
    const existingNames = new Set((existingDisc || []).map((d: any) => d.name.toLowerCase()));
    
    // Try to find product data in messages/output
    await parseIncrementalDiscoveries(supabase, questId, allText, quest.profile, existingNames);

    // If complete and we still have the output, do a final parse
    if (questStatus === "complete" && outputText) {
      await parseAndStoreDiscoveries(supabase, questId, outputText, quest.profile, existingNames);
    }

    // Get all messages for response
    const { data: allMessages } = await supabase
      .from("quest_messages")
      .select("*")
      .eq("quest_id", questId)
      .order("created_at", { ascending: true });

    return new Response(JSON.stringify({
      questId: quest.id, status: questStatus, currentNode, visitedNodes,
      liveUrl: quest.live_url, messages: allMessages || [], output: outputText || null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("quest-status error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function parseIncrementalDiscoveries(supabase: any, questId: string, allText: string, profile: any, existingNames: Set<string>) {
  // Look for individual product mentions in the text
  // Try JSON arrays first
  const jsonMatches = allText.match(/\[\s*\{[\s\S]*?\}\s*\]/g) || [];
  for (const match of jsonMatches) {
    try {
      const parsed = JSON.parse(match);
      if (!Array.isArray(parsed)) continue;
      
      const validGifts = parsed.filter((g: any) => g.name && g.url && g.price !== undefined);
      const newGifts = validGifts.filter((g: any) => !existingNames.has(g.name.toLowerCase()));
      
      if (newGifts.length > 0) {
        const discoveries = newGifts.map((gift: any, idx: number) => {
          const price = typeof gift.price === "number" ? gift.price : parseFloat(String(gift.price).replace(/[^0-9.]/g, "")) || 0;
          const budget = profile.budget || 50;
          const budgetFit = Math.max(0, 100 - Math.abs(price - budget) / budget * 100);
          const baseScore = 95 - idx * 3;
          
          return {
            quest_id: questId,
            name: gift.name,
            emoji: guessEmoji(gift.name),
            site: gift.site || "Unknown",
            price,
            url: gift.url,
            why_text: gift.reason || "A thoughtful gift match.",
            alchemy_score: Math.min(99, Math.max(60, Math.round((baseScore + budgetFit) / 2))),
            image_url: gift.image_url || null,
            sub_scores: {
              personalityMatch: Math.min(99, baseScore + Math.floor(Math.random() * 5)),
              uniqueness: Math.min(99, 70 + Math.floor(Math.random() * 25)),
              budgetFit: Math.round(budgetFit),
              surpriseFactor: Math.min(99, 65 + Math.floor(Math.random() * 30)),
            },
          };
        });
        
        await supabase.from("discoveries").insert(discoveries);
        // Update existingNames
        discoveries.forEach((d: any) => existingNames.add(d.name.toLowerCase()));
      }
    } catch { /* not valid JSON */ }
  }
}

function guessEmoji(name: string): string {
  const n = name.toLowerCase();
  const map: Record<string, string> = {
    coffee: "☕", tea: "🍵", book: "📚", journal: "📓", candle: "🕯️",
    mug: "☕", wine: "🍷", game: "🎮", music: "🎵", art: "🎨",
    cook: "🍳", garden: "🌱", travel: "🌍", fitness: "🏋️", tech: "🖥️",
    podcast: "🎙️", mystery: "🔍", detective: "🕵️", craft: "✂️",
    kit: "📦", set: "🎁", subscription: "📬", print: "🖼️",
  };
  for (const [key, val] of Object.entries(map)) {
    if (n.includes(key)) return val;
  }
  return "🎁";
}

async function parseAndStoreDiscoveries(supabase: any, questId: string, output: string, profile: any, existingNames: Set<string>) {
  try {
    const jsonMatch = output.match(/\[\s*\{[\s\S]*?\}\s*\]/);
    if (jsonMatch) {
      const gifts = JSON.parse(jsonMatch[0]);
      const newGifts = gifts.filter((g: any) => g.name && !existingNames.has(g.name.toLowerCase()));
      
      if (newGifts.length > 0) {
        const discoveries = newGifts.map((gift: any, idx: number) => {
          const price = typeof gift.price === "number" ? gift.price : parseFloat(String(gift.price).replace(/[^0-9.]/g, "")) || 0;
          const budget = profile.budget || 50;
          const budgetFit = Math.max(0, 100 - Math.abs(price - budget) / budget * 100);
          const baseScore = 95 - idx * 3;
          
          return {
            quest_id: questId, name: gift.name, emoji: guessEmoji(gift.name),
            site: gift.site || "Unknown", price, url: gift.url,
            why_text: gift.reason || "A thoughtful gift match.",
            alchemy_score: Math.min(99, Math.max(60, Math.round((baseScore + budgetFit) / 2))),
            sub_scores: {
              personalityMatch: Math.min(99, baseScore + Math.floor(Math.random() * 5)),
              uniqueness: Math.min(99, 70 + Math.floor(Math.random() * 25)),
              budgetFit: Math.round(budgetFit),
              surpriseFactor: Math.min(99, 65 + Math.floor(Math.random() * 30)),
            },
          };
        });
        await supabase.from("discoveries").insert(discoveries);
      }
      return;
    }
    
    // Fallback: AI parsing
    await parseWithAI(supabase, questId, output, profile, existingNames);
  } catch (e) {
    console.error("Failed to parse discoveries:", e);
    await parseWithAI(supabase, questId, output, profile, existingNames);
  }
}

async function parseWithAI(supabase: any, questId: string, output: string, profile: any, existingNames: Set<string>) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Extract gift products from this browser agent output. Return JSON array with: name, price (number), url, site, reason (one sentence), selected_option (if product has variants like color/size, which specific option)." },
          { role: "user", content: output.substring(0, 8000) },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_gifts",
            description: "Extract gift data",
            parameters: {
              type: "object",
              properties: {
                gifts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" }, price: { type: "number" },
                      url: { type: "string" }, site: { type: "string" },
                      reason: { type: "string" }, selected_option: { type: "string" },
                    },
                    required: ["name", "price", "url", "site", "reason"],
                  },
                },
              },
              required: ["gifts"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_gifts" } },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const parsed = JSON.parse(toolCall.function.arguments);
        const newGifts = (parsed.gifts || []).filter((g: any) => !existingNames.has(g.name.toLowerCase()));
        if (newGifts.length > 0) {
          const discoveries = newGifts.map((gift: any, idx: number) => ({
            quest_id: questId, name: gift.name, emoji: guessEmoji(gift.name),
            site: gift.site, price: gift.price, url: gift.url,
            why_text: gift.selected_option ? `${gift.reason} (Option: ${gift.selected_option})` : gift.reason,
            alchemy_score: Math.max(60, 95 - idx * 4),
            sub_scores: { personalityMatch: 85 + Math.floor(Math.random() * 10), uniqueness: 70 + Math.floor(Math.random() * 25), budgetFit: 80, surpriseFactor: 70 + Math.floor(Math.random() * 25) },
          }));
          await supabase.from("discoveries").insert(discoveries);
        }
      }
    }
  } catch (e) {
    console.error("AI parsing fallback failed:", e);
  }
}
