import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BROWSER_USE_API = "https://api.browser-use.com/api/v3";
const MAX_QUEST_DURATION = 20 * 60 * 1000;
const TARGET_DISCOVERY_COUNT = 6;

function inferCurrentNode(stepCount: number, messages: any[]): { currentNode: string; visitedNodes: string[] } {
  const visited: string[] = ["base"];
  let current = "base";
  const messageText = messages.map((m: any) => (m.summary || m.content || m.lastStepSummary || "").toLowerCase()).join(" ");

  if (messageText.includes("uncommon") || messageText.includes("mcphee") || messageText.includes("offthewagon") || stepCount >= 3) { visited.push("specialty"); current = "specialty"; }
  if (messageText.includes("amazon") || stepCount >= 10) { visited.push("amazon"); current = "amazon"; }
  if (messageText.includes("zazzle") || messageText.includes("yoursurprise") || messageText.includes("giftsforyounow") || stepCount >= 18) { visited.push("niche"); current = "niche"; }

  return { currentNode: current, visitedNodes: [...new Set(visited)] };
}

function cleanAgentMessage(raw: string): string {
  if (!raw) return "";
  let cleaned = raw;
  // Strip HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, "");
  // Strip code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  // Strip inline code
  cleaned = cleaned.replace(/`[^`]+`/g, (match) => match.replace(/`/g, ""));
  // Strip JSON blobs (large objects/arrays)
  cleaned = cleaned.replace(/\{[\s\S]{100,}\}/g, "[analyzing data]");
  cleaned = cleaned.replace(/\[\s*\{[\s\S]{100,}\}\s*\]/g, "[found products]");
  cleaned = cleaned.replace(/GIFT_FOUND:\s*\[[\s\S]*?\]/g, "[found a gift!]");
  // Strip long URLs
  cleaned = cleaned.replace(/https?:\/\/\S{60,}/g, "[link]");
  cleaned = cleaned.replace(/^python:\s*/i, "");
  cleaned = cleaned.replace(/^getting browser state$/i, "Checking the page");
  cleaned = cleaned.replace(/^running python code$/i, "Thinking...");
  // Clean whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n").replace(/\s{3,}/g, " ").trim();
  // Skip empty/short
  if (cleaned.length < 5) return "";
  // Truncate
  if (cleaned.length > 250) cleaned = cleaned.substring(0, 247) + "...";
  return cleaned;
}

function guessEmoji(name: string): string {
  const n = name.toLowerCase();
  const map: Record<string, string> = {
    coffee: "☕", tea: "🍵", book: "📚", journal: "📓", candle: "🕯️",
    mug: "☕", wine: "🍷", game: "🎮", music: "🎵", art: "🎨",
    cook: "🍳", garden: "🌱", travel: "🌍", fitness: "🏋️", tech: "🖥️",
    podcast: "🎙️", mystery: "🔍", detective: "🕵️", craft: "✂️",
    kit: "📦", set: "🎁", subscription: "📬", print: "🖼️",
    chocolate: "🍫", soap: "🧼", bath: "🛁", plant: "🌿",
    socks: "🧦", puzzle: "🧩", lamp: "💡", clock: "⏰",
    hat: "🎩", shirt: "👕", bag: "👜", phone: "📱",
  };
  for (const [key, val] of Object.entries(map)) {
    if (n.includes(key)) return val;
  }
  return "🎁";
}

// Normalize a URL for dedup purposes
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    u.search = "";
    return u.origin + u.pathname;
  } catch {
    return url.toLowerCase().trim();
  }
}

function extractStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") {
    acc.push(value);
    return acc;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => extractStrings(item, acc));
    return acc;
  }

  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) => extractStrings(item, acc));
  }

  return acc;
}

function uniqueStrings(lines: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

async function fetchSessionMessages(sessionId: string, apiKey: string) {
  try {
    const response = await fetch(`${BROWSER_USE_API}/sessions/${sessionId}/messages?limit=100`, {
      headers: { "X-Browser-Use-API-Key": apiKey },
    });

    if (!response.ok) {
      console.error("Browser Use messages error:", response.status);
      return [];
    }

    const payload = await response.json();
    const messages = Array.isArray(payload)
      ? payload
      : payload.messages || payload.items || payload.data || [];

    return Array.isArray(messages) ? messages : [];
  } catch (error) {
    console.error("Failed to fetch Browser Use messages:", error);
    return [];
  }
}

async function stopSession(sessionId: string, apiKey: string) {
  try {
    await fetch(`${BROWSER_USE_API}/sessions/${sessionId}/stop`, {
      method: "POST",
      headers: {
        "X-Browser-Use-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ strategy: "session" }),
    });
  } catch (error) {
    console.error("Failed to stop Browser Use session:", error);
  }
}

async function stopSessionIfStillRunning(sessionId: string, apiKey: string) {
  try {
    const response = await fetch(`${BROWSER_USE_API}/sessions/${sessionId}`, {
      headers: { "X-Browser-Use-API-Key": apiKey },
    });

    if (!response.ok) return;

    const session = await response.json();
    if (session.status === "running") {
      await stopSession(sessionId, apiKey);
    }
  } catch (error) {
    console.error("Failed to stop orphaned Browser Use session:", error);
  }
}

function extractJsonArray(text: string, startIndex: number): string | null {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIndex; i < text.length; i += 1) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(startIndex, i + 1);
      }
    }
  }

  return null;
}

function extractGiftPayloads(text: string): string[] {
  const payloads: string[] = [];
  const seen = new Set<string>();
  const marker = /GIFT_FOUND:\s*/g;
  let match: RegExpExecArray | null;

  while ((match = marker.exec(text)) !== null) {
    const arrayStart = text.indexOf("[", match.index + match[0].length);
    if (arrayStart === -1) continue;

    const payload = extractJsonArray(text, arrayStart);
    if (payload && payload.includes('"name"') && payload.includes('"url"') && !seen.has(payload)) {
      seen.add(payload);
      payloads.push(payload);
      marker.lastIndex = arrayStart + payload.length;
    }
  }

  if (payloads.length > 0) return payloads;

  const fallback = /\[[\s\S]*?"name"[\s\S]*?"url"[\s\S]*?\]/g;
  for (const raw of text.match(fallback) || []) {
    if (!seen.has(raw)) {
      seen.add(raw);
      payloads.push(raw);
    }
  }

  return payloads;
}

function buildTranscript(lastStepSummary: string, outputText: string, sessionMessages: any[]) {
  const extracted = uniqueStrings(extractStrings(sessionMessages));
  return [lastStepSummary, outputText, ...extracted].filter(Boolean).join("\n");
}

function buildDiscoveryRow(gift: any, idx: number, budget: number, questId: string) {
  const price = typeof gift.price === "number"
    ? gift.price
    : parseFloat(String(gift.price).replace(/[^0-9.]/g, "")) || 0;
  const budgetFit = Math.max(0, 100 - Math.abs(price - budget) / budget * 100);
  const baseScore = 95 - idx * 3;

  return {
    quest_id: questId,
    name: gift.selected_option ? `${gift.name} (${gift.selected_option})` : gift.name,
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

    if (quest.status === "complete" || quest.status === "error") {
      if (quest.session_id) {
        await stopSessionIfStillRunning(quest.session_id, BROWSER_USE_API_KEY);
      }

      const [{ data: messages }, { data: discoveries }] = await Promise.all([
        supabase
          .from("quest_messages")
          .select("*")
          .eq("quest_id", questId)
          .order("created_at", { ascending: true }),
        supabase
          .from("discoveries")
          .select("*")
          .eq("quest_id", questId)
          .order("alchemy_score", { ascending: false }),
      ]);

      return new Response(JSON.stringify({
        questId: quest.id,
        status: quest.status,
        currentNode: quest.current_node,
        visitedNodes: quest.visited_nodes,
        liveUrl: quest.live_url,
        messages: messages || [],
        discoveries: discoveries || [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const questAge = Date.now() - new Date(quest.created_at).getTime();

    if (questAge > MAX_QUEST_DURATION) {
      if (quest.session_id) {
        await stopSession(quest.session_id, BROWSER_USE_API_KEY);
      }

      await supabase.from("quests").update({
        status: "complete",
        current_node: "alchemy",
        updated_at: new Date().toISOString(),
      }).eq("id", questId);

      const [{ data: messages }, { data: discoveries }] = await Promise.all([
        supabase
          .from("quest_messages")
          .select("*")
          .eq("quest_id", questId)
          .order("created_at", { ascending: true }),
        supabase
          .from("discoveries")
          .select("*")
          .eq("quest_id", questId)
          .order("alchemy_score", { ascending: false }),
      ]);

      return new Response(JSON.stringify({
        questId: quest.id, status: "complete",
        currentNode: "alchemy", visitedNodes: [...(quest.visited_nodes || []), "alchemy"],
        liveUrl: quest.live_url, messages: messages || [], discoveries: discoveries || [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const [buResponse, sessionMessages] = await Promise.all([
      fetch(`${BROWSER_USE_API}/sessions/${quest.session_id}`, {
        headers: { "X-Browser-Use-API-Key": BROWSER_USE_API_KEY },
      }),
      fetchSessionMessages(quest.session_id, BROWSER_USE_API_KEY),
    ]);

    if (!buResponse.ok) {
      console.error("Browser Use poll error:", buResponse.status);
      throw new Error("Failed to poll Browser Use session");
    }

    const buSession = await buResponse.json();
    console.log("BU session status:", buSession.status, "stepCount:", buSession.stepCount);

    const buStatus = buSession.status;
    let questStatus = "running";

    if (buStatus === "stopped" || buStatus === "timed_out") {
      questStatus = "complete";
    } else if (buStatus === "error") {
      questStatus = "complete";
    }

    const stepCount = buSession.stepCount || 0;
    const lastStepSummary = buSession.lastStepSummary || "";
    const outputText = typeof buSession.output === "string"
      ? buSession.output
      : JSON.stringify(buSession.output || "");
    const transcript = buildTranscript(lastStepSummary, outputText, sessionMessages);

    const { currentNode, visitedNodes } = inferCurrentNode(stepCount, [{ summary: transcript }]);
    if (questStatus === "complete") {
      visitedNodes.push("alchemy");
    }

    // Store lastStepSummary as a thought message if meaningful
    if (lastStepSummary) {
      const cleaned = cleanAgentMessage(lastStepSummary);
      if (cleaned && cleaned.length >= 5) {
        const { data: existingMsgs } = await supabase
          .from("quest_messages")
          .select("summary")
          .eq("quest_id", questId)
          .order("created_at", { ascending: false })
          .limit(5);

        const recentSummaries = new Set((existingMsgs || []).map((m: any) => m.summary));
        const formatted = `> ${cleaned}`;
        if (!recentSummaries.has(formatted)) {
          await supabase.from("quest_messages").insert({
            quest_id: questId,
            role: "agent",
            summary: formatted,
          });
        }
      }
    }

    // Get existing discoveries for dedup
    const { data: existingDisc } = await supabase
      .from("discoveries")
      .select("name, url")
      .eq("quest_id", questId);

    const existingNames = new Set((existingDisc || []).map((d: any) => d.name.toLowerCase()));
    const existingUrls = new Set((existingDisc || []).map((d: any) => normalizeUrl(d.url)));

    // Try to extract discoveries from output and lastStepSummary
    await parseIncrementalDiscoveries(supabase, questId, transcript, quest.profile, existingNames, existingUrls);

    if (questStatus === "complete" && transcript) {
      await parseAndStoreDiscoveries(supabase, questId, transcript, quest.profile, existingNames, existingUrls);
    }

    const { data: allDiscoveries } = await supabase
      .from("discoveries")
      .select("*")
      .eq("quest_id", questId)
      .order("alchemy_score", { ascending: false });

    if (questStatus === "running" && (allDiscoveries || []).length >= TARGET_DISCOVERY_COUNT) {
      await stopSession(quest.session_id, BROWSER_USE_API_KEY);
      questStatus = "complete";
      visitedNodes.push("alchemy");
    }

    await supabase.from("quests").update({
      status: questStatus,
      current_node: questStatus === "complete" ? "alchemy" : currentNode,
      visited_nodes: [...new Set(visitedNodes)],
      updated_at: new Date().toISOString(),
    }).eq("id", questId);

    const { data: allMessages } = await supabase
      .from("quest_messages")
      .select("*")
      .eq("quest_id", questId)
      .order("created_at", { ascending: true });

    return new Response(JSON.stringify({
      questId: quest.id, status: questStatus, currentNode: questStatus === "complete" ? "alchemy" : currentNode,
      visitedNodes: [...new Set(visitedNodes)],
      liveUrl: quest.live_url, messages: allMessages || [], discoveries: allDiscoveries || [], output: outputText || null,
      stepCount,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("quest-status error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function isDuplicate(name: string, url: string, existingNames: Set<string>, existingUrls: Set<string>): boolean {
  if (existingNames.has(name.toLowerCase())) return true;
  if (existingUrls.has(normalizeUrl(url))) return true;
  return false;
}

async function parseIncrementalDiscoveries(supabase: any, questId: string, allText: string, profile: any, existingNames: Set<string>, existingUrls: Set<string>) {
  const allMatches = extractGiftPayloads(allText);
  const budget = profile.budget || 50;

  for (const match of allMatches) {
    try {
      const parsed = JSON.parse(match);
      if (!Array.isArray(parsed)) continue;

      const validGifts = parsed.filter((g: any) => g.name && g.url && g.price !== undefined);
      const newGifts = validGifts.filter((g: any) => !isDuplicate(g.name, g.url, existingNames, existingUrls));

      if (newGifts.length > 0) {
        const discoveries = newGifts.map((gift: any, idx: number) => buildDiscoveryRow(gift, idx, budget, questId));

        await supabase.from("discoveries").insert(discoveries);
        discoveries.forEach((d: any) => {
          existingNames.add(d.name.toLowerCase());
          existingUrls.add(normalizeUrl(d.url));
        });
      }
    } catch { /* not valid JSON */ }
  }
}

async function parseAndStoreDiscoveries(supabase: any, questId: string, output: string, profile: any, existingNames: Set<string>, existingUrls: Set<string>) {
  try {
    const payloads = extractGiftPayloads(output);

    for (const payload of payloads) {
      const gifts = JSON.parse(payload);
      const newGifts = gifts.filter((g: any) => g.name && g.url && !isDuplicate(g.name, g.url, existingNames, existingUrls));

      if (newGifts.length > 0) {
        const budget = profile.budget || 50;
        const discoveries = newGifts.map((gift: any, idx: number) => buildDiscoveryRow(gift, idx, budget, questId));
        await supabase.from("discoveries").insert(discoveries);
        return;
      }
    }

    await parseWithAI(supabase, questId, output, profile, existingNames, existingUrls);
  } catch (e) {
    console.error("Failed to parse discoveries:", e);
    await parseWithAI(supabase, questId, output, profile, existingNames, existingUrls);
  }
}

async function parseWithAI(supabase: any, questId: string, output: string, profile: any, existingNames: Set<string>, existingUrls: Set<string>) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Extract gift products from this browser agent output. Return a JSON array with objects containing: name, price (number), url, site, reason (one sentence why it's a good gift), selected_option (specific variant like color/size if applicable). Only include real products with real URLs. No duplicates." },
          { role: "user", content: output.substring(0, 8000) },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (jsonMatch) {
        const gifts = JSON.parse(jsonMatch[0]);
        const newGifts = gifts.filter((g: any) => g.name && g.url && !isDuplicate(g.name, g.url, existingNames, existingUrls));
        if (newGifts.length > 0) {
          const budget = profile.budget || 50;
          const discoveries = newGifts.map((gift: any, idx: number) => {
            const price = typeof gift.price === "number" ? gift.price : parseFloat(String(gift.price).replace(/[^0-9.]/g, "")) || 0;
            const budgetFit = Math.max(0, 100 - Math.abs(price - budget) / budget * 100);
            return {
              quest_id: questId, name: gift.selected_option ? `${gift.name} (${gift.selected_option})` : gift.name,
              emoji: guessEmoji(gift.name), site: gift.site || "Unknown", price, url: gift.url,
              why_text: gift.reason || "A thoughtful gift match.",
              alchemy_score: Math.max(60, 95 - idx * 4),
              sub_scores: { personalityMatch: 85 + Math.floor(Math.random() * 10), uniqueness: 70 + Math.floor(Math.random() * 25), budgetFit: Math.round(budgetFit), surpriseFactor: 70 + Math.floor(Math.random() * 25) },
            };
          });
          await supabase.from("discoveries").insert(discoveries);
        }
      }
    } else {
      const errText = await response.text();
      console.error("AI parsing failed:", errText);
    }
  } catch (e) {
    console.error("AI parsing fallback failed:", e);
  }
}
