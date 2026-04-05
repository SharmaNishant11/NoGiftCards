import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BROWSER_USE_API = "https://api.browser-use.com/api/v3";
const MAX_QUEST_DURATION = 20 * 60 * 1000;
const TARGET_DISCOVERY_COUNT = 6;

// ── helpers ──────────────────────────────────────────────────────────

function inferCurrentNode(stepCount: number, text: string): { currentNode: string; visitedNodes: string[] } {
  const visited: string[] = ["base"];
  let current = "specialty"; // we always start at specialty stores
  const t = text.toLowerCase();

  // Only mark sites visited based on TEXT evidence (the agent actually mentioning the site)
  // Step count is only used as a loose secondary signal with high thresholds
  const mentionsSpecialty = t.includes("uncommon") || t.includes("mcphee") || t.includes("offthewagon");
  const mentionsAmazon = t.includes("amazon");
  const mentionsNiche = t.includes("zazzle") || t.includes("yoursurprise") || t.includes("giftsforyounow");

  if (mentionsSpecialty || stepCount >= 8) { visited.push("specialty"); current = "specialty"; }
  if (mentionsAmazon || stepCount >= 18) { visited.push("amazon"); current = "amazon"; }
  if (mentionsNiche || stepCount >= 28) { visited.push("niche"); current = "niche"; }

  return { currentNode: current, visitedNodes: [...new Set(visited)] };
}

function cleanAgentMessage(raw: string): string {
  if (!raw) return "";
  let s = raw;
  s = s.replace(/<[^>]*>/g, "");
  s = s.replace(/```[\s\S]*?```/g, "");
  s = s.replace(/`[^`]+`/g, (m) => m.replace(/`/g, ""));
  s = s.replace(/\{[\s\S]{100,}\}/g, "[analyzing data]");
  s = s.replace(/\[\s*\{[\s\S]{100,}\}\s*\]/g, "[found products]");
  s = s.replace(/GIFT_FOUND:\s*\[[\s\S]*?\]/g, "[🎁 found a gift!]");
  s = s.replace(/https?:\/\/\S{60,}/g, "[link]");
  s = s.replace(/^python:\s*/i, "");
  s = s.replace(/^getting browser state$/i, "Checking the page…");
  s = s.replace(/^running python code$/i, "Thinking…");
  s = s.replace(/\n{3,}/g, "\n").replace(/\s{3,}/g, " ").trim();
  if (s.length < 5) return "";
  if (s.length > 250) s = s.substring(0, 247) + "…";
  return s;
}

function guessEmoji(name: string): string {
  const n = name.toLowerCase();
  const m: Record<string, string> = {
    coffee: "☕", tea: "🍵", book: "📚", journal: "📓", candle: "🕯️",
    mug: "☕", wine: "🍷", game: "🎮", music: "🎵", art: "🎨",
    cook: "🍳", garden: "🌱", travel: "🌍", fitness: "🏋️", tech: "🖥️",
    podcast: "🎙️", mystery: "🔍", detective: "🕵️", craft: "✂️",
    kit: "📦", set: "🎁", subscription: "📬", print: "🖼️",
    chocolate: "🍫", soap: "🧼", bath: "🛁", plant: "🌿",
    socks: "🧦", puzzle: "🧩", lamp: "💡", clock: "⏰",
    hat: "🎩", shirt: "👕", bag: "👜", phone: "📱",
    map: "🗺️", projector: "🌌", star: "⭐", scratch: "🗺️",
  };
  for (const [k, v] of Object.entries(m)) {
    if (n.includes(k)) return v;
  }
  return "🎁";
}

function normalizeUrl(url: string): string {
  try { const u = new URL(url); u.hash = ""; u.search = ""; return u.origin + u.pathname; }
  catch { return url.toLowerCase().trim(); }
}

function matchesPlaceholder(value: unknown, patterns: RegExp[]): boolean {
  return typeof value === "string" && patterns.some((pattern) => pattern.test(value.trim()));
}

function hasValidProductUrl(url: unknown): boolean {
  if (typeof url !== "string" || !url.trim()) return false;

  try {
    const parsed = new URL(url);
    const blockedHosts = new Set(["exact-url", "example.com", "placeholder.com", "localhost"]);

    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.hostname.includes(".") &&
      !blockedHosts.has(parsed.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

function isRealGiftCandidate(gift: any): boolean {
  const price = typeof gift?.price === "number"
    ? gift.price
    : parseFloat(String(gift?.price ?? "").replace(/[^0-9.]/g, ""));

  if (!Number.isFinite(price) || price <= 0) return false;
  if (!hasValidProductUrl(gift?.url)) return false;

  if (matchesPlaceholder(gift?.name, [
    /^product name(?:\b|\s|\()/i,
    /^gift name(?:\b|\s|\()/i,
    /^item name(?:\b|\s|\()/i,
    /^name$/i,
    /lorem ipsum/i,
  ])) return false;

  if (matchesPlaceholder(gift?.reason, [
    /^why this is perfect[.!]*$/i,
    /^why it's perfect[.!]*$/i,
    /^reason here[.!]*$/i,
    /^description here[.!]*$/i,
    /^add reason/i,
  ])) return false;

  if (matchesPlaceholder(gift?.site, [
    /^site name$/i,
    /^store name$/i,
  ])) return false;

  return true;
}

function isRealDiscoveryRow(discovery: any): boolean {
  return isRealGiftCandidate({
    name: discovery?.name,
    price: discovery?.price,
    url: discovery?.url,
    site: discovery?.site,
    reason: discovery?.why_text,
  });
}

function isDuplicate(name: string, url: string, existingNames: Set<string>, existingUrls: Set<string>): boolean {
  return existingNames.has(name.toLowerCase()) || existingUrls.has(normalizeUrl(url));
}

function buildDiscoveryRow(gift: any, idx: number, budget: number, questId: string) {
  const price = typeof gift.price === "number" ? gift.price : parseFloat(String(gift.price).replace(/[^0-9.]/g, "")) || 0;
  const budgetFit = Math.max(0, 100 - Math.abs(price - budget) / budget * 100);
  const baseScore = 95 - idx * 3;
  return {
    quest_id: questId,
    name: gift.selected_option ? `${gift.name} (${gift.selected_option})` : gift.name,
    emoji: guessEmoji(gift.name), site: gift.site || "Unknown", price, url: gift.url,
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

// ── Browser Use helpers ──────────────────────────────────────────────

async function stopSession(sessionId: string, apiKey: string) {
  try {
    await fetch(`${BROWSER_USE_API}/sessions/${sessionId}/stop`, {
      method: "POST",
      headers: { "X-Browser-Use-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ strategy: "session" }),
    });
  } catch (e) { console.error("Stop session error:", e); }
}

async function stopSessionIfStillRunning(sessionId: string, apiKey: string) {
  try {
    const r = await fetch(`${BROWSER_USE_API}/sessions/${sessionId}`, {
      headers: { "X-Browser-Use-API-Key": apiKey },
    });
    if (!r.ok) return;
    const s = await r.json();
    if (s.status === "running") await stopSession(sessionId, apiKey);
  } catch (e) { console.error("Stop orphan error:", e); }
}

/**
 * Fetch Browser Use messages with cursor pagination.
 * Returns an array of PARSED text strings extracted from message.data.content[].text
 * plus the raw lastStepSummary and output.
 */
async function fetchBrowserUseTexts(
  sessionId: string,
  apiKey: string,
  lastSeenMsgId: string | null,
): Promise<{ texts: string[]; lastMsgId: string | null; totalMsgs: number }> {
  const allTexts: string[] = [];
  let cursor: string | undefined = lastSeenMsgId || undefined;
  let totalMsgs = 0;
  let pagesRead = 0;

  // Read up to 5 pages of 50 messages each (250 msgs max per poll)
  while (pagesRead < 5) {
    const qs = cursor
      ? `limit=50&cursor=${cursor}`
      : `limit=50`;
    const resp = await fetch(`${BROWSER_USE_API}/sessions/${sessionId}/messages?${qs}`, {
      headers: { "X-Browser-Use-API-Key": apiKey },
    });
    if (!resp.ok) { console.error("BU messages error:", resp.status); break; }
    const payload = await resp.json();
    const msgs = payload.messages || [];
    totalMsgs += msgs.length;
    pagesRead++;

    for (const msg of msgs) {
      cursor = msg.id; // track last seen
      if (!msg.data) continue;

      // Parse the data JSON string to extract content texts
      try {
        const parsed = typeof msg.data === "string" ? JSON.parse(msg.data) : msg.data;

        // Extract content[].text (where GIFT_FOUND lives)
        if (Array.isArray(parsed.content)) {
          for (const c of parsed.content) {
            if (typeof c === "string") allTexts.push(c);
            else if (c?.text) allTexts.push(c.text);
          }
        } else if (typeof parsed.content === "string") {
          allTexts.push(parsed.content);
        }

        // Also extract top-level text
        if (typeof parsed.text === "string") allTexts.push(parsed.text);
      } catch {
        // data wasn't JSON, use as-is
        if (typeof msg.data === "string" && msg.data.length > 5) {
          allTexts.push(msg.data);
        }
      }
    }

    if (!payload.hasMore || msgs.length === 0) break;
  }

  return { texts: allTexts, lastMsgId: cursor || null, totalMsgs };
}

// ── Gift extraction ──────────────────────────────────────────────────

function extractGiftPayloads(text: string): string[] {
  const payloads: string[] = [];
  const seen = new Set<string>();

  // Primary: find GIFT_FOUND: [...] markers
  const marker = /GIFT_FOUND:\s*(\[[\s\S]*?\](?=\s|$|\n))/g;
  let m: RegExpExecArray | null;
  while ((m = marker.exec(text)) !== null) {
    const payload = m[1];
    if (payload && payload.includes('"name"') && payload.includes('"url"') && !seen.has(payload)) {
      seen.add(payload);
      payloads.push(payload);
    }
  }

  return payloads;
}

function extractAndInsertGifts(
  allTexts: string[],
  budget: number,
  questId: string,
  existingNames: Set<string>,
  existingUrls: Set<string>,
): any[] {
  const newDiscoveries: any[] = [];

  for (const text of allTexts) {
    if (!text.includes("GIFT_FOUND")) continue;

    const payloads = extractGiftPayloads(text);
    for (const payload of payloads) {
      try {
        const gifts = JSON.parse(payload);
        if (!Array.isArray(gifts)) continue;

        for (const gift of gifts) {
          if (!gift.name || !gift.url || gift.price === undefined) continue;
          if (!isRealGiftCandidate(gift)) continue;
          if (isDuplicate(gift.name, gift.url, existingNames, existingUrls)) continue;

          const row = buildDiscoveryRow(gift, newDiscoveries.length, budget, questId);
          newDiscoveries.push(row);
          existingNames.add(row.name.toLowerCase());
          existingUrls.add(normalizeUrl(row.url));
        }
      } catch { /* not valid JSON */ }
    }
  }

  return newDiscoveries;
}

// ── AI fallback extraction ───────────────────────────────────────────

async function parseWithAI(supabase: any, questId: string, output: string, profile: any, existingNames: Set<string>, existingUrls: Set<string>) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Extract gift products from this browser agent output. Return a JSON array with objects containing: name, price (number), url, site, reason. Only real products with real URLs. No duplicates." },
          { role: "user", content: output.substring(0, 6000) },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (jsonMatch) {
        const gifts = JSON.parse(jsonMatch[0]);
        const budget = profile.budget || 50;
        const newGifts = gifts.filter((g: any) => (
          g.name &&
          g.url &&
          isRealGiftCandidate(g) &&
          !isDuplicate(g.name, g.url, existingNames, existingUrls)
        ));
        if (newGifts.length > 0) {
          const discoveries = newGifts.map((g: any, i: number) => buildDiscoveryRow(g, i, budget, questId));
          await supabase.from("discoveries").insert(discoveries);
        }
      }
    } else {
      const errText = await response.text();
      console.error("AI parsing failed:", errText);
    }
  } catch (e) { console.error("AI fallback error:", e); }
}

// ── Main handler ─────────────────────────────────────────────────────

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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Fetch quest ──────────────────────────────────────────────────
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

    // ── Already complete: return cached data ─────────────────────────
    if (quest.status === "complete" || quest.status === "error") {
      if (quest.session_id) await stopSessionIfStillRunning(quest.session_id, BROWSER_USE_API_KEY);

      const [{ data: messages }, { data: discoveries }] = await Promise.all([
        supabase.from("quest_messages").select("*").eq("quest_id", questId).order("created_at", { ascending: true }),
        supabase.from("discoveries").select("*").eq("quest_id", questId).order("alchemy_score", { ascending: false }),
      ]);

      const validDiscoveries = (discoveries || []).filter(isRealDiscoveryRow);

      return new Response(JSON.stringify({
        questId: quest.id, status: quest.status,
        currentNode: quest.current_node, visitedNodes: quest.visited_nodes,
        liveUrl: quest.live_url, messages: messages || [], discoveries: validDiscoveries,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Safety timeout ───────────────────────────────────────────────
    const questAge = Date.now() - new Date(quest.created_at).getTime();
    if (questAge > MAX_QUEST_DURATION) {
      if (quest.session_id) await stopSession(quest.session_id, BROWSER_USE_API_KEY);
      await supabase.from("quests").update({ status: "complete", current_node: "alchemy", updated_at: new Date().toISOString() }).eq("id", questId);

      const [{ data: messages }, { data: discoveries }] = await Promise.all([
        supabase.from("quest_messages").select("*").eq("quest_id", questId).order("created_at", { ascending: true }),
        supabase.from("discoveries").select("*").eq("quest_id", questId).order("alchemy_score", { ascending: false }),
      ]);

      const validDiscoveries = (discoveries || []).filter(isRealDiscoveryRow);

      return new Response(JSON.stringify({
        questId: quest.id, status: "complete",
        currentNode: "alchemy", visitedNodes: [...(quest.visited_nodes || []), "alchemy"],
        liveUrl: quest.live_url, messages: messages || [], discoveries: validDiscoveries,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Poll Browser Use session + messages in parallel ──────────────
    const lastSeenMsgId = quest.last_seen_msg_id || null;

    const [buResponse, buTexts] = await Promise.all([
      fetch(`${BROWSER_USE_API}/sessions/${quest.session_id}`, {
        headers: { "X-Browser-Use-API-Key": BROWSER_USE_API_KEY },
      }),
      fetchBrowserUseTexts(quest.session_id, BROWSER_USE_API_KEY, lastSeenMsgId),
    ]);

    if (!buResponse.ok) throw new Error("Failed to poll Browser Use session");
    const buSession = await buResponse.json();
    console.log("BU status:", buSession.status, "steps:", buSession.stepCount, "newTexts:", buTexts.texts.length);

    // ── Determine quest status ───────────────────────────────────────
    let questStatus = "running";
    if (buSession.status === "stopped" || buSession.status === "timed_out" || buSession.status === "error") {
      questStatus = "complete";
    }

    const stepCount = buSession.stepCount || 0;
    const lastStepSummary = buSession.lastStepSummary || "";
    const allTextsForExtraction = [...buTexts.texts];

    // Also add output text if available (populated on completion)
    if (buSession.output) {
      const outputStr = typeof buSession.output === "string" ? buSession.output : JSON.stringify(buSession.output);
      allTextsForExtraction.push(outputStr);
    }

    // ── Infer map position ───────────────────────────────────────────
    const combinedText = [...allTextsForExtraction, lastStepSummary].join(" ");
    const { currentNode, visitedNodes } = inferCurrentNode(stepCount, combinedText);
    if (questStatus === "complete") visitedNodes.push("alchemy");

    // ── Store thought messages ───────────────────────────────────────
    if (lastStepSummary) {
      const cleaned = cleanAgentMessage(lastStepSummary);
      if (cleaned && cleaned.length >= 5) {
        const { data: existing } = await supabase
          .from("quest_messages")
          .select("summary")
          .eq("quest_id", questId)
          .order("created_at", { ascending: false })
          .limit(5);

        const recent = new Set((existing || []).map((m: any) => m.summary));
        const formatted = `> ${cleaned}`;
        if (!recent.has(formatted)) {
          await supabase.from("quest_messages").insert({ quest_id: questId, role: "agent", summary: formatted });
        }
      }
    }

    // ── Extract new discoveries ──────────────────────────────────────
    const { data: existingDisc } = await supabase
      .from("discoveries")
      .select("name, url, why_text, site, price")
      .eq("quest_id", questId);

    const validExistingDisc = (existingDisc || []).filter(isRealDiscoveryRow);
    const existingNames = new Set(validExistingDisc.map((d: any) => d.name.toLowerCase()));
    const existingUrls = new Set(validExistingDisc.map((d: any) => normalizeUrl(d.url)));

    const newRows = extractAndInsertGifts(allTextsForExtraction, quest.profile?.budget || 50, questId, existingNames, existingUrls);
    if (newRows.length > 0) {
      console.log(`Inserting ${newRows.length} new discoveries`);
      await supabase.from("discoveries").insert(newRows);
    }

    // ── AI fallback on completion if nothing was found ────────────────
    if (questStatus === "complete" && validExistingDisc.length === 0 && newRows.length === 0 && buSession.output) {
      const outputStr = typeof buSession.output === "string" ? buSession.output : JSON.stringify(buSession.output);
      await parseWithAI(supabase, questId, outputStr, quest.profile, existingNames, existingUrls);
    }

    // ── Check if we have enough discoveries to stop ──────────────────
    const { data: allDiscoveries } = await supabase
      .from("discoveries")
      .select("*")
      .eq("quest_id", questId)
      .order("alchemy_score", { ascending: false });

    const validDiscoveries = (allDiscoveries || []).filter(isRealDiscoveryRow);

    if (questStatus === "running" && validDiscoveries.length >= TARGET_DISCOVERY_COUNT) {
      console.log("Target reached, stopping session");
      await stopSession(quest.session_id, BROWSER_USE_API_KEY);
      questStatus = "complete";
      visitedNodes.push("alchemy");
    }

    // ── Update quest record ──────────────────────────────────────────
    await supabase.from("quests").update({
      status: questStatus,
      current_node: questStatus === "complete" ? "alchemy" : currentNode,
      visited_nodes: [...new Set(visitedNodes)],
      updated_at: new Date().toISOString(),
    }).eq("id", questId);

    // ── Return response ──────────────────────────────────────────────
    const { data: allMessages } = await supabase
      .from("quest_messages")
      .select("*")
      .eq("quest_id", questId)
      .order("created_at", { ascending: true });

    return new Response(JSON.stringify({
      questId: quest.id,
      status: questStatus,
      currentNode: questStatus === "complete" ? "alchemy" : currentNode,
      visitedNodes: [...new Set(visitedNodes)],
      liveUrl: quest.live_url,
      messages: allMessages || [],
      discoveries: validDiscoveries,
      stepCount,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("quest-status error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
