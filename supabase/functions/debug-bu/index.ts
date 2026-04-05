import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BROWSER_USE_API = "https://api.browser-use.com/api/v3";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const API_KEY = Deno.env.get("BROWSER_USE_API_KEY")!;
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  
  if (!sessionId) {
    return new Response(JSON.stringify({ error: "sessionId required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch session
  const sessionResp = await fetch(`${BROWSER_USE_API}/sessions/${sessionId}`, {
    headers: { "X-Browser-Use-API-Key": API_KEY },
  });
  const session = await sessionResp.json();

  // Fetch messages (with pagination)
  let allMessages: any[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;
  
  while (hasMore) {
    const msgUrl = cursor 
      ? `${BROWSER_USE_API}/sessions/${sessionId}/messages?limit=50&cursor=${cursor}`
      : `${BROWSER_USE_API}/sessions/${sessionId}/messages?limit=50`;
    
    const msgResp = await fetch(msgUrl, {
      headers: { "X-Browser-Use-API-Key": API_KEY },
    });
    const msgPayload = await msgResp.json();
    const msgs = msgPayload.messages || [];
    allMessages = allMessages.concat(msgs);
    hasMore = msgPayload.hasMore === true;
    if (msgs.length > 0 && hasMore) {
      cursor = msgs[msgs.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  // Analyze
  const outputStr = typeof session.output === "string" ? session.output : JSON.stringify(session.output || "");
  const types = [...new Set(allMessages.map((m: any) => m.type))];
  
  // Find GIFT_FOUND in messages
  const giftFoundMessages = allMessages.filter((m: any) => {
    const data = typeof m.data === "string" ? m.data : JSON.stringify(m.data || "");
    return data.includes("GIFT_FOUND");
  }).map((m: any) => ({
    type: m.type,
    dataPreview: (typeof m.data === "string" ? m.data : JSON.stringify(m.data || "")).substring(0, 500),
  }));

  // Find product-like mentions in messages  
  const productMessages = allMessages.filter((m: any) => {
    const data = typeof m.data === "string" ? m.data : JSON.stringify(m.data || "");
    return data.includes("$") && (data.includes("product") || data.includes("price") || data.includes("gift") || data.includes("uncommon") || data.includes("amazon") || data.includes(".com"));
  }).map((m: any, i: number) => ({
    index: allMessages.indexOf(m),
    type: m.type,
    dataPreview: (typeof m.data === "string" ? m.data : JSON.stringify(m.data || "")).substring(0, 400),
  }));

  // Sample messages of each type
  const samplesByType: Record<string, string[]> = {};
  for (const m of allMessages) {
    const t = m.type || "unknown";
    if (!samplesByType[t]) samplesByType[t] = [];
    if (samplesByType[t].length < 2) {
      samplesByType[t].push((typeof m.data === "string" ? m.data : JSON.stringify(m.data || "")).substring(0, 300));
    }
  }

  return new Response(JSON.stringify({
    session: {
      status: session.status,
      stepCount: session.stepCount,
      lastStepSummary: session.lastStepSummary?.substring(0, 300),
      outputLength: outputStr.length,
      outputHasGiftFound: outputStr.includes("GIFT_FOUND"),
      outputPreview: outputStr.substring(0, 1000),
    },
    messages: {
      total: allMessages.length,
      types,
      samplesByType,
      giftFoundMessages,
      productMessages: productMessages.slice(0, 10),
    },
  }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
