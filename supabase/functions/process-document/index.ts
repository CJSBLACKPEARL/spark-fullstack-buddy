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
    const { filePath, userId, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Processing document: ${fileName}`);

    // Download the file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("academic-documents")
      .download(filePath);

    if (downloadError) {
      console.error("Error downloading file:", downloadError);
      throw downloadError;
    }

    // Convert file to base64 for AI processing
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Extract text content using AI
    const extractResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the main content and key points from this document. Provide a comprehensive summary.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!extractResponse.ok) {
      throw new Error("Failed to extract document content");
    }

    const extractData = await extractResponse.json();
    const documentContent = extractData.choices[0].message.content;

    console.log("Document content extracted, generating study materials...");

    // Generate flashcards
    const flashcardsResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: "You are a flashcard generator. Create educational flashcards from document content.",
          },
          {
            role: "user",
            content: `Based on this document content, generate 10 flashcards:\n\n${documentContent}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_flashcards",
              description: "Create flashcards from document",
              parameters: {
                type: "object",
                properties: {
                  flashcards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        front: { type: "string" },
                        back: { type: "string" },
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

    const flashcardsData = await flashcardsResponse.json();
    const flashcards = JSON.parse(flashcardsData.choices[0].message.tool_calls[0].function.arguments);

    // Save flashcards
    const flashcardsToInsert = flashcards.flashcards.map((card: any) => ({
      user_id: userId,
      title: fileName,
      front: card.front,
      back: card.back,
      category: "academic",
      source_type: "ppt_generated",
    }));

    await supabase.from("flashcards").insert(flashcardsToInsert);

    // Generate quiz
    const quizResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: "You are a quiz generator. Create multiple-choice questions from document content.",
          },
          {
            role: "user",
            content: `Based on this document content, generate 5 multiple-choice questions:\n\n${documentContent}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_quiz",
              description: "Create quiz from document",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        options: { type: "array", items: { type: "string" } },
                        correctAnswer: { type: "number" },
                      },
                      required: ["question", "options", "correctAnswer"],
                    },
                  },
                },
                required: ["questions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_quiz" } },
      }),
    });

    const quizData = await quizResponse.json();
    const quiz = JSON.parse(quizData.choices[0].message.tool_calls[0].function.arguments);

    // Save quiz
    await supabase.from("quizzes").insert({
      user_id: userId,
      title: `${fileName} Quiz`,
      description: `Quiz generated from ${fileName}`,
      questions: quiz.questions,
      source_type: "ppt_generated",
    });

    return new Response(
      JSON.stringify({ success: true, flashcardsCount: flashcards.flashcards.length, questionsCount: quiz.questions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing document:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});