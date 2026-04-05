import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const API_KEY = Deno.env.get("BROWSER_USE_API_KEY")!;
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) return new Response("need sessionId", { status: 400, headers: corsHeaders });

  const BU = "https://api.browser-use.com/api/v3";

  // Paginate all messages
  let allMessages: any[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 10; page++) {
    const msgUrl = cursor 
      ? `${BU}/sessions/${sessionId}/messages?limit=50&cursor=${cursor}`
      : `${BU}/sessions/${sessionId}/messages?limit=50`;
    const msgResp = await fetch(msgUrl, { headers: { "X-Browser-Use-API-Key": API_KEY } });
    const payload = await msgResp.json();
    const msgs = payload.messages || [];
    allMessages = allMessages.concat(msgs);
    if (!payload.hasMore || msgs.length === 0) break;
    cursor = msgs[msgs.length - 1].id;
  }

  // Deep extract GIFT_FOUND from messages
  const giftFoundEntries: any[] = [];
  for (let i = 0; i < allMessages.length; i++) {
    const m = allMessages[i];
    let dataStr = typeof m.data === "string" ? m.data : JSON.stringify(m.data || "");
    
    // Try to parse data as JSON to get nested content
    try {
      const parsed = JSON.parse(dataStr);
      if (parsed.content) {
        if (Array.isArray(parsed.content)) {
          for (const c of parsed.content) {
            const text = c.text || c.content || "";
            if (text.includes("GIFT_FOUND")) {
              giftFoundEntries.push({ msgIndex: i, type: m.type, text: text.substring(0, 500) });
            }
          }
        } else if (typeof parsed.content === "string" && parsed.content.includes("GIFT_FOUND")) {
          giftFoundEntries.push({ msgIndex: i, type: m.type, text: parsed.content.substring(0, 500) });
        }
      }
      // Also check top-level text
      if (typeof parsed.text === "string" && parsed.text.includes("GIFT_FOUND")) {
        giftFoundEntries.push({ msgIndex: i, type: m.type, text: parsed.text.substring(0, 500) });
      }
    } catch {}
    
    // Fallback: check raw string
    if (dataStr.includes("GIFT_FOUND") && !giftFoundEntries.some(e => e.msgIndex === i)) {
      giftFoundEntries.push({ msgIndex: i, type: m.type, rawPreview: dataStr.substring(dataStr.indexOf("GIFT_FOUND"), dataStr.indexOf("GIFT_FOUND") + 300) });
    }
  }

  return new Response(JSON.stringify({
    totalMessages: allMessages.length,
    types: [...new Set(allMessages.map((m: any) => m.type))],
    typeCounts: allMessages.reduce((acc: any, m: any) => { acc[m.type] = (acc[m.type] || 0) + 1; return acc; }, {}),
    giftFoundEntries,
  }, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
