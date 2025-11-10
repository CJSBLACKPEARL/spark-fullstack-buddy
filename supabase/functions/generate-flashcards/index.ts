import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, count, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating ${count} flashcards on topic: ${topic}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a flashcard generator. Create educational flashcards with clear questions on the front and concise answers on the back.",
          },
          {
            role: "user",
            content: `Generate ${count} flashcards about "${topic}". Each flashcard should have a clear question or prompt on the front and a detailed but concise answer on the back.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_flashcards",
              description: "Create a set of educational flashcards",
              parameters: {
                type: "object",
                properties: {
                  flashcards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        front: { type: "string", description: "Question or prompt" },
                        back: { type: "string", description: "Answer or explanation" },
                      },
                      required: ["front", "back"],
                    },
                  },
                },
                required: ["flashcards"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_flashcards" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    const flashcardsData = JSON.parse(toolCall.function.arguments);

    // Save flashcards to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const flashcardsToInsert = flashcardsData.flashcards.map((card: any) => ({
      user_id: userId,
      title: topic,
      front: card.front,
      back: card.back,
      category: "academic",
      source_type: "ai_generated",
    }));

    const { error: insertError } = await supabase.from("flashcards").insert(flashcardsToInsert);

    if (insertError) {
      console.error("Error inserting flashcards:", insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ flashcards: flashcardsData.flashcards }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});