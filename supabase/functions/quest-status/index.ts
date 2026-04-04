import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BROWSER_USE_API = "https://api.browser-use.com/api/v3";

// Map Browser Use status messages to adventure map nodes
function inferCurrentNode(messages: any[]): { currentNode: string; visitedNodes: string[] } {
  const visited: string[] = ["base"];
  let current = "base";
  
  const messageText = messages.map((m: any) => (m.summary || "").toLowerCase()).join(" ");
  
  if (messageText.includes("etsy")) {
    visited.push("etsy");
    current = "etsy";
  }
  if (messageText.includes("amazon")) {
    visited.push("amazon");
    current = "amazon";
  }
  if (messageText.includes("specialty") || messageText.includes("uncommon") || messageText.includes("food52")) {
    visited.push("specialty");
    current = "specialty";
  }
  if (messageText.includes("niche") || messageText.includes("specific")) {
    visited.push("niche");
    current = "niche";
  }
  
  return { currentNode: current, visitedNodes: [...new Set(visited)] };
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

    // Get quest from DB
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

    // Infer map position from messages
    const { currentNode, visitedNodes } = inferCurrentNode(buMessages);

    // Determine quest status from Browser Use status
    const buStatus = buSession.status?.value || buSession.status || "running";
    let questStatus = "running";
    if (buStatus === "idle" || buStatus === "stopped" || buStatus === "completed") {
      questStatus = "complete";
      // Add alchemy scoring node
      visitedNodes.push("alchemy");
    } else if (buStatus === "error" || buStatus === "timed_out") {
      questStatus = "error";
    }

    // Sync new messages to DB
    const { data: existingMsgs } = await supabase
      .from("quest_messages")
      .select("summary")
      .eq("quest_id", questId);

    const existingSummaries = new Set((existingMsgs || []).map((m: any) => m.summary));

    const newMessages = buMessages
      .filter((m: any) => m.summary && !existingSummaries.has(`> [${m.role}] ${m.summary}`))
      .map((m: any) => ({
        quest_id: questId,
        role: m.role || "agent",
        summary: `> [${m.role}] ${m.summary}`,
      }));

    if (newMessages.length > 0) {
      await supabase.from("quest_messages").insert(newMessages);
    }

    // Update quest record
    await supabase
      .from("quests")
      .update({
        status: questStatus,
        current_node: currentNode,
        visited_nodes: visitedNodes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", questId);

    // If complete, parse discoveries from the output
    if (questStatus === "complete" && buSession.output) {
      await parseAndStoreDiscoveries(supabase, questId, buSession.output, quest.profile);
    }

    // Get all messages for response
    const { data: allMessages } = await supabase
      .from("quest_messages")
      .select("*")
      .eq("quest_id", questId)
      .order("created_at", { ascending: true });

    return new Response(JSON.stringify({
      questId: quest.id,
      status: questStatus,
      currentNode,
      visitedNodes,
      liveUrl: quest.live_url,
      messages: allMessages || [],
      output: buSession.output || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("quest-status error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function parseAndStoreDiscoveries(supabase: any, questId: string, output: string, profile: any) {
  // Check if we already parsed discoveries for this quest
  const { data: existing } = await supabase
    .from("discoveries")
    .select("id")
    .eq("quest_id", questId)
    .limit(1);

  if (existing && existing.length > 0) return;

  try {
    // Try to extract JSON array from the output
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON array found in Browser Use output");
      // Try using AI to parse unstructured output
      await parseWithAI(supabase, questId, output, profile);
      return;
    }

    const gifts = JSON.parse(jsonMatch[0]);
    const emojiMap: Record<string, string> = {
      coffee: "☕", tea: "🍵", book: "📚", journal: "📓", candle: "🕯️",
      mug: "☕", wine: "🍷", game: "🎮", music: "🎵", art: "🎨",
      cook: "🍳", garden: "🌱", travel: "🌍", fitness: "🏋️", tech: "🖥️",
      podcast: "🎙️", mystery: "🔍", detective: "🕵️", craft: "✂️",
    };

    const discoveries = gifts.map((gift: any, idx: number) => {
      // Auto-assign emoji based on name
      const nameLower = (gift.name || "").toLowerCase();
      let emoji = "🎁";
      for (const [key, val] of Object.entries(emojiMap)) {
        if (nameLower.includes(key)) { emoji = val; break; }
      }

      // Calculate alchemy score (simple heuristic based on price fit and description)
      const price = typeof gift.price === "number" ? gift.price : parseFloat(String(gift.price).replace(/[^0-9.]/g, "")) || 0;
      const budget = profile.budget || 50;
      const budgetFit = Math.max(0, 100 - Math.abs(price - budget) / budget * 100);
      const baseScore = 95 - idx * 3; // Decreasing score for variety
      const alchemyScore = Math.round((baseScore + budgetFit) / 2);

      return {
        quest_id: questId,
        name: gift.name || "Mystery Gift",
        emoji,
        site: gift.site || "Unknown",
        price: price,
        url: gift.url || "#",
        why_text: gift.reason || "A thoughtful gift match.",
        alchemy_score: Math.min(99, Math.max(60, alchemyScore)),
        sub_scores: {
          personalityMatch: Math.min(99, baseScore + Math.floor(Math.random() * 5)),
          uniqueness: Math.min(99, 70 + Math.floor(Math.random() * 25)),
          budgetFit: Math.round(budgetFit),
          surpriseFactor: Math.min(99, 65 + Math.floor(Math.random() * 30)),
        },
      };
    });

    if (discoveries.length > 0) {
      await supabase.from("discoveries").insert(discoveries);
    }
  } catch (e) {
    console.error("Failed to parse discoveries:", e);
    await parseWithAI(supabase, questId, output, profile);
  }
}

async function parseWithAI(supabase: any, questId: string, output: string, profile: any) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "Extract gift product data from this browser agent output. Return a JSON array of objects with: name, price (number), url, site, reason (one sentence).",
          },
          { role: "user", content: output },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_gifts",
            description: "Extract gift data from agent output",
            parameters: {
              type: "object",
              properties: {
                gifts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      price: { type: "number" },
                      url: { type: "string" },
                      site: { type: "string" },
                      reason: { type: "string" },
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
        if (parsed.gifts?.length > 0) {
          const discoveries = parsed.gifts.map((gift: any, idx: number) => ({
            quest_id: questId,
            name: gift.name,
            emoji: "🎁",
            site: gift.site,
            price: gift.price,
            url: gift.url,
            why_text: gift.reason,
            alchemy_score: Math.max(60, 95 - idx * 4),
            sub_scores: {
              personalityMatch: 85 + Math.floor(Math.random() * 10),
              uniqueness: 70 + Math.floor(Math.random() * 25),
              budgetFit: 80,
              surpriseFactor: 70 + Math.floor(Math.random() * 25),
            },
          }));
          await supabase.from("discoveries").insert(discoveries);
        }
      }
    }
  } catch (e) {
    console.error("AI parsing fallback failed:", e);
  }
}
