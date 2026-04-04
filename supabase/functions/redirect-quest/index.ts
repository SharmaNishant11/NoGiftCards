import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BROWSER_USE_API = "https://api.browser-use.com/api/v3";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { questId, message } = await req.json();
    if (!questId || !message) {
      return new Response(JSON.stringify({ error: "questId and message required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BROWSER_USE_API_KEY = Deno.env.get("BROWSER_USE_API_KEY");
    if (!BROWSER_USE_API_KEY) throw new Error("BROWSER_USE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get quest session ID
    const { data: quest, error: questErr } = await supabase
      .from("quests")
      .select("session_id, status")
      .eq("id", questId)
      .single();

    if (questErr || !quest) {
      return new Response(JSON.stringify({ error: "Quest not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (quest.status !== "running") {
      return new Response(JSON.stringify({ error: "Quest is not currently running" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send follow-up task to Browser Use session
    const buResponse = await fetch(`${BROWSER_USE_API}/sessions/${quest.session_id}/tasks`, {
      method: "POST",
      headers: {
        "X-Browser-Use-API-Key": BROWSER_USE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task: `REDIRECT: The user wants you to change your search strategy. ${message}. Continue finding gifts but adjust your approach based on this feedback.`,
      }),
    });

    // Log the redirect as a message
    await supabase.from("quest_messages").insert({
      quest_id: questId,
      role: "user",
      summary: `> Redirecting: ${message}...`,
    });

    // Update quest status
    await supabase
      .from("quests")
      .update({ status: "running", updated_at: new Date().toISOString() })
      .eq("id", questId);

    return new Response(JSON.stringify({ success: true, message: `Agent redirected: ${message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("redirect-quest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
