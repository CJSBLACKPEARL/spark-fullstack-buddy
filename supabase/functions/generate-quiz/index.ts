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
    const { topic, questionCount, difficulty, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating ${questionCount} ${difficulty} questions on topic: ${topic}`);

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
            content: "You are a quiz generator. Create multiple-choice questions with 4 options each and indicate the correct answer.",
          },
          {
            role: "user",
            content: `Generate ${questionCount} ${difficulty} difficulty multiple-choice questions about "${topic}". Each question should have 4 options and a clear correct answer.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_quiz",
              description: "Create a multiple-choice quiz",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Quiz title" },
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string", description: "The question text" },
                        options: {
                          type: "array",
                          items: { type: "string" },
                          description: "Four answer options",
                        },
                        correctAnswer: { type: "number", description: "Index of correct answer (0-3)" },
                      },
                      required: ["question", "options", "correctAnswer"],
                    },
                  },
                },
                required: ["title", "questions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_quiz" } },
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
    const quizData = JSON.parse(toolCall.function.arguments);

    // Save quiz to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: insertError } = await supabase.from("quizzes").insert({
      user_id: userId,
      title: quizData.title || `${topic} Quiz`,
      description: `${difficulty} difficulty quiz on ${topic}`,
      questions: quizData.questions,
      source_type: "ai_generated",
    });

    if (insertError) {
      console.error("Error inserting quiz:", insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ quiz: quizData }),
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