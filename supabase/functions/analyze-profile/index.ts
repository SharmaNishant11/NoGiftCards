import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, name } = await req.json();
    if (!text || !name) {
      return new Response(JSON.stringify({ error: "text and name are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a personality analyst for a gift recommendation engine called GiftAlchemy. 
Given a conversation or bio text about/from a person, extract personality traits, quirks, hobbies, and generate a "Gift DNA" profile.

You MUST call the extract_profile function with your analysis.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this conversation/text about a person named "${name}" and extract their personality profile for gift recommendations:\n\n${text}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_profile",
            description: "Extract personality profile from conversation analysis",
            parameters: {
              type: "object",
              properties: {
                traits: {
                  type: "array",
                  items: { type: "string" },
                  description: "Personality trait IDs from: coffee, bookworm, adventurer, chef, tech, nightowl, creative, gamer, wellness, traveler"
                },
                quirks: {
                  type: "array",
                  items: { type: "string" },
                  description: "Quirk IDs from: mornings, late, overthinker, chaotic, researcher, bougie, dramatic, introvert"
                },
                hobbies: {
                  type: "array",
                  items: { type: "string" },
                  description: "Hobby IDs from: truecrime, binge, gym, garden, wine, shopping, music, puzzles"
                },
                dnaScores: {
                  type: "object",
                  properties: {
                    sentimental: { type: "number", description: "0-100 score" },
                    practical: { type: "number", description: "0-100 score" },
                    adventurous: { type: "number", description: "0-100 score" },
                    luxurious: { type: "number", description: "0-100 score" },
                    quirky: { type: "number", description: "0-100 score" },
                  },
                  required: ["sentimental", "practical", "adventurous", "luxurious", "quirky"],
                },
                summary: {
                  type: "string",
                  description: "One witty sentence describing this person's gift personality, e.g. 'Alex is a caffeine-dependent amateur detective who treats mornings as a personal enemy.'"
                },
                signalCount: {
                  type: "number",
                  description: "Number of distinct personality signals detected in the text"
                }
              },
              required: ["traits", "quirks", "hobbies", "dnaScores", "summary", "signalCount"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_profile" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const profile = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(profile), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-profile error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
