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

    // Build the traits description for the agent
    const traitNames = [...(profile.personalities || []), ...(profile.quirks || []), ...(profile.hobbies || [])];
    const traitDesc = traitNames.join(", ") || "no specific traits";
    const budget = profile.budget || 50;
    const occasion = profile.occasion || "general";
    const notes = profile.notes || "";
    const claudeSummary = profile.claudeSummary || "";

    // Craft a detailed Browser Use task prompt
    const taskPrompt = `You are a gift-finding agent for GiftAlchemy. Find 6-8 unique, personalized gift ideas for a person with these characteristics:

Name: ${profile.name}
Personality: ${traitDesc}
${claudeSummary ? `AI Analysis: ${claudeSummary}` : ''}
${notes ? `Additional notes: ${notes}` : ''}
Budget: $${budget} (find gifts ranging from $${Math.round(budget * 0.3)} to $${Math.round(budget * 1.2)})
Occasion: ${occasion}

INSTRUCTIONS:
1. First, search Etsy.com for 2-3 unique handmade/artisan gifts matching this personality. Search for specific terms related to their interests.
2. Then search Amazon.com for 2-3 gifts. Look for well-reviewed products that match their interests.
3. Then search 1-2 specialty/niche stores relevant to their interests (e.g. uncommongoods.com, food52.com, etc.)

For EACH gift found, extract:
- The exact product name
- The price (in USD)
- The full product URL (the actual link to buy)
- The store/site name (e.g. "Etsy", "Amazon", "Uncommon Goods")
- A one-sentence reason why this person would love it

Return your findings as a JSON array like this:
[
  {
    "name": "Product Name",
    "price": 42.99,
    "url": "https://www.etsy.com/listing/...",
    "site": "Etsy",
    "reason": "Perfect for a coffee lover who hates mornings"
  }
]

IMPORTANT: Only return REAL products with REAL URLs that actually exist. Visit each product page to verify the price and URL. Focus on unique, thoughtful gifts — not generic items.`;

    // Start Browser Use session
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

    // Create quest record in database
    const { data: quest, error: dbError } = await supabase
      .from("quests")
      .insert({
        session_id: buSession.id,
        live_url: buSession.live_url || null,
        profile: profile,
        status: "running",
        current_node: "etsy",
        visited_nodes: ["base"],
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Insert initial thought message
    await supabase.from("quest_messages").insert({
      quest_id: quest.id,
      role: "system",
      summary: `> Quest launched! Searching for gifts for ${profile.name}...`,
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
