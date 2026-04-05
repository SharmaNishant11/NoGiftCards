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

  const [sessResp, msgResp] = await Promise.all([
    fetch(`${BU}/sessions/${sessionId}`, { headers: { "X-Browser-Use-API-Key": API_KEY } }),
    fetch(`${BU}/sessions/${sessionId}/messages?limit=20`, { headers: { "X-Browser-Use-API-Key": API_KEY } }),
  ]);

  const session = await sessResp.json();
  const msgPayload = await msgResp.json();
  const msgs = msgPayload.messages || [];

  const outputStr = typeof session.output === "string" ? session.output : JSON.stringify(session.output || "");

  return new Response(JSON.stringify({
    sessionStatus: session.status,
    stepCount: session.stepCount,
    outputLength: outputStr.length,
    outputHasGiftFound: outputStr.includes("GIFT_FOUND"),
    outputFirst500: outputStr.substring(0, 500),
    outputLast500: outputStr.substring(Math.max(0, outputStr.length - 500)),
    msgCount: msgs.length,
    hasMore: msgPayload.hasMore,
    msgTypes: [...new Set(msgs.map((m: any) => m.type))],
    firstMsg: msgs[0] ? { type: msgs[0].type, dataLen: msgs[0].data?.length, data: String(msgs[0].data || "").substring(0, 300) } : null,
    lastMsg: msgs[msgs.length-1] ? { type: msgs[msgs.length-1].type, dataLen: msgs[msgs.length-1].data?.length, data: String(msgs[msgs.length-1].data || "").substring(0, 300) } : null,
    giftFoundInMsgs: msgs.filter((m: any) => String(m.data || "").includes("GIFT_FOUND")).length,
  }, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
