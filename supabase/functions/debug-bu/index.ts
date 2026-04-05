import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BROWSER_USE_API = "https://api.browser-use.com/api/v3";

// Same extraction logic as quest-status
function extractGiftPayloads(text: string): string[] {
  const payloads: string[] = [];
  const seen = new Set<string>();
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const API_KEY = Deno.env.get("BROWSER_USE_API_KEY")!;
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) return new Response("need sessionId", { status: 400, headers: corsHeaders });

  // Simulate incremental polling: fetch messages page by page
  // and check if we find GIFT_FOUND on each page
  const results: { page: number; msgsOnPage: number; textsExtracted: number; giftsFound: number; giftNames: string[] }[] = [];
  let cursor: string | undefined;
  let cumulativeGifts: string[] = [];

  for (let page = 0; page < 5; page++) {
    const qs = cursor ? `limit=50&cursor=${cursor}` : `limit=50`;
    const resp = await fetch(`${BROWSER_USE_API}/sessions/${sessionId}/messages?${qs}`, {
      headers: { "X-Browser-Use-API-Key": API_KEY },
    });
    const payload = await resp.json();
    const msgs = payload.messages || [];

    const textsThisPage: string[] = [];
    for (const msg of msgs) {
      if (!msg.data) continue;
      cursor = msg.id;
      try {
        const parsed = typeof msg.data === "string" ? JSON.parse(msg.data) : msg.data;
        if (Array.isArray(parsed.content)) {
          for (const c of parsed.content) {
            if (c?.text) textsThisPage.push(c.text);
            else if (typeof c === "string") textsThisPage.push(c);
          }
        } else if (typeof parsed.content === "string") {
          textsThisPage.push(parsed.content);
        }
        if (typeof parsed.text === "string") textsThisPage.push(parsed.text);
      } catch {
        if (typeof msg.data === "string") textsThisPage.push(msg.data);
      }
    }

    // Extract gifts from this page's texts
    const pageGiftNames: string[] = [];
    for (const text of textsThisPage) {
      if (!text.includes("GIFT_FOUND")) continue;
      const payloads = extractGiftPayloads(text);
      for (const p of payloads) {
        try {
          const gifts = JSON.parse(p);
          if (Array.isArray(gifts)) {
            for (const g of gifts) {
              if (g.name && !cumulativeGifts.includes(g.name)) {
                cumulativeGifts.push(g.name);
                pageGiftNames.push(g.name);
              }
            }
          }
        } catch (e) {
          pageGiftNames.push(`PARSE_ERROR: ${(e as Error).message} - ${p.substring(0, 100)}`);
        }
      }
    }

    results.push({
      page,
      msgsOnPage: msgs.length,
      textsExtracted: textsThisPage.length,
      giftsFound: pageGiftNames.length,
      giftNames: pageGiftNames,
    });

    if (!payload.hasMore || msgs.length === 0) break;
  }

  return new Response(JSON.stringify({
    totalUniqueGifts: cumulativeGifts.length,
    allGiftNames: cumulativeGifts,
    pageResults: results,
  }, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
