import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Set system prompts based on category
    let systemPrompt = "";
    
    const formatRules = ` FORMATTING RULES:
- Keep responses SHORT (150-250 words max). Be direct and actionable.
- Use **bold** for key terms, exercise names, food items, and important concepts.
- Use bullet points for lists. Use numbered lists for steps/sequences.
- When presenting structured data (meal plans, workout schedules, comparisons), ALWAYS use markdown tables with proper | column | headers |.
- Use ### for section headers when needed.
- Never write walls of text. Break into small paragraphs (2-3 sentences max).
- Only elaborate if the user explicitly asks for detail.

LOCALIZATION RULE:
- ALWAYS use universally understood ingredient names and include local/regional alternatives in parentheses. For example: "chickpeas (chana)", "cottage cheese (paneer)", "lentils (dal)", "fenugreek (methi)".
- When suggesting foods, exercises, or products, include options that are accessible worldwide — not just Western countries. Include Indian, Asian, African, and Latin American alternatives where relevant.
- Use metric units (kg, cm) alongside imperial when mentioning measurements.
- Never assume the user is from the US. Be globally inclusive.`;

    if (category === "health") {
      systemPrompt = "You are a professional health and fitness AI coach. Give concise, actionable workout plans, diet tips, and sport-specific advice. Use globally accessible food names with local equivalents (e.g., chickpeas/chana, cottage cheese/paneer, lentils/dal). When asked for plans or schedules, present them in clean markdown tables." + formatRules;
    } else if (category === "academic") {
      systemPrompt = "You are a professional academic AI tutor. Give concise study strategies, test prep tips, and learning advice. Use structured formatting. Be globally inclusive in examples and references." + formatRules;
    } else if (category === "wellness") {
      systemPrompt = `You are a professional mental wellness AI guide. Give concise stress management, motivation, and work-life balance tips. Be empathetic but brief. Include culturally diverse wellness practices (yoga, meditation, tai chi, etc.).

MOTIVATIONAL CONTENT RULE:
- At the END of every response, include a "💡 **Daily Motivation**" section with:
  1. A powerful motivational quote with its author (use quotes from diverse leaders — e.g., APJ Abdul Kalam, Marcus Aurelius, Maya Angelou, Rumi, Swami Vivekananda, Nelson Mandela, etc.)
  2. A "🎥 **Recommended Watch**" — suggest a specific YouTube video or TED Talk related to the user's concern (include the title, speaker name, and a brief 1-line description). Examples: "The Power of Vulnerability — Brené Brown (TED Talk)", "Atomic Habits — James Clear (YouTube)", "Ikigai — Finding Purpose (TEDx)".
- Rotate quotes and video suggestions — never repeat the same ones in a conversation.` + formatRules;
    } else {
      systemPrompt = "You are PeakPerform AI, helping users with fitness, academics, and wellness. Be concise, professional, and globally inclusive." + formatRules;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});