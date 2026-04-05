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
    const profile = await req.json();
    if (!profile.name) {
      return new Response(JSON.stringify({ error: "Profile with name is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BROWSER_USE_API_KEY = Deno.env.get("BROWSER_USE_API_KEY");
    if (!BROWSER_USE_API_KEY) throw new Error("BROWSER_USE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const traitNames = [...(profile.personalities || []), ...(profile.quirks || []), ...(profile.hobbies || [])];
    const traitDesc = traitNames.join(", ") || "no specific traits";
    const budget = profile.budget || 50;
    const occasion = profile.occasion || "general";
    const notes = profile.notes || "";
    const claudeSummary = profile.claudeSummary || "";

    const taskPrompt = `You are a gift-finding agent for NoGiftCards. Find 6 unique, personalized gift ideas for a person with these characteristics:

Name: ${profile.name}
Personality: ${traitDesc}
${claudeSummary ? `AI Analysis: ${claudeSummary}` : ''}
${notes ? `Additional notes: ${notes}` : ''}
Budget: $${budget} (find gifts ranging from $${Math.round(budget * 0.3)} to $${Math.round(budget * 1.2)})
Occasion: ${occasion}

INSTRUCTIONS:
1. Your first priority is speed: get the first strong gift found and reported as fast as possible.
2. Prioritize these stores first because they work well for this task:
   - uncommongoods.com
   - mcphee.com
   - offthewagonshop.com
   - giftsforyounow.com
   - yoursurprise.com/funny-gifts
   - zazzle.com
3. Search Amazon.com for up to 2 gifts if you still need more variety. Look for well-reviewed products.
4. Search 1-2 of these specialty stores for unique/funny gifts:
   - mcphee.com (weird/funny novelty gifts)
   - offthewagonshop.com (unique gifts)
   - giftsforyounow.com (personalized gifts)
   - yoursurprise.com/funny-gifts (funny personalized gifts)
   - zazzle.com (custom products)
5. If a store is slow, blocked, or awkward, give up quickly and move on.
6. Do not collect all 6 before reporting. Report each verified gift immediately.

DO NOT search Etsy — it blocks automated browsing. If any site blocks you or takes too long, skip it quickly and move on.

CRITICAL - OUTPUT FORMAT:
After finding EACH gift, you MUST immediately output a plain-text JSON block so results appear one at a time in the live UI.
The first GIFT_FOUND should happen as early as possible, ideally within your first few successful product-page visits.
The JSON example below is only a schema example — NEVER copy its literal values.
Use this exact format after each product page visit:

GIFT_FOUND: [{"name": "Product Name", "price": 42.99, "url": "https://exact-url", "site": "UncommonGoods", "reason": "Why this is perfect", "selected_option": "Color: Blue"}]

CRITICAL REQUIREMENTS:
- Visit EACH product page to verify the EXACT price shown on the page.
- If a product has multiple options (colors, sizes, flavors), note which specific option you recommend and confirm the price for THAT option.
- The price you report MUST match what's shown on the product page for the selected option.
- Copy the EXACT product URL from the browser address bar.
- Each gift must be UNIQUE — no duplicates.
- Output GIFT_FOUND after EACH product, not all at the end.
- Never wait until the end to print multiple gifts together.
- As soon as you have 6 strong unique gifts, stop browsing and finish the task.
- Placeholder values like "Product Name", "Why this is perfect", and "https://exact-url" are INVALID and must never be returned.

IMPORTANT: Only return REAL products with REAL URLs. Visit each product page to verify price and URL. Focus on unique, thoughtful, sometimes funny gifts — NOT generic stuff.`;

    const buResponse = await fetch(`${BROWSER_USE_API}/sessions`, {
      method: "POST",
      headers: {
        "X-Browser-Use-API-Key": BROWSER_USE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task: taskPrompt }),
    });

    if (!buResponse.ok) {
      const errText = await buResponse.text();
      console.error("Browser Use error:", buResponse.status, errText);
      throw new Error(`Browser Use API error: ${buResponse.status} - ${errText}`);
    }

    const buSession = await buResponse.json();
    console.log("Browser Use session created:", JSON.stringify(buSession));

    const { data: quest, error: dbError } = await supabase
      .from("quests")
      .insert({
        session_id: buSession.id,
        live_url: buSession.live_url || null,
        profile: profile,
        status: "running",
        current_node: "specialty",
        visited_nodes: ["base"],
      })
      .select()
      .single();

    if (dbError) throw dbError;

    await supabase.from("quest_messages").insert({
      quest_id: quest.id,
      role: "system",
      summary: `> Agents deployed! Hunting gifts for ${profile.name}...`,
    });

    return new Response(JSON.stringify({
      questId: quest.id,
      sessionId: buSession.id,
      liveUrl: buSession.live_url || null,
      status: "running",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("launch-quest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
