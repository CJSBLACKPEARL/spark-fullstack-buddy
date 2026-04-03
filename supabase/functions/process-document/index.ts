import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

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

    // Convert file to base64 safely (no spread operator crash)
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = uint8ArrayToBase64(new Uint8Array(arrayBuffer));

    // Determine mime type
    const ext = fileName.split(".").pop()?.toLowerCase();
    let mimeType = "application/pdf";
    if (ext === "pptx" || ext === "ppt") mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    if (ext === "docx" || ext === "doc") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    console.log(`File downloaded, size: ${arrayBuffer.byteLength}, mime: ${mimeType}`);

    // Extract text content using AI vision
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
                text: "Extract ALL the text content from this document. Include every heading, paragraph, bullet point, and detail. Return just the raw text.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!extractResponse.ok) {
      const errText = await extractResponse.text();
      console.error("AI extraction error:", extractResponse.status, errText);
      throw new Error(`Failed to extract document content: ${extractResponse.status}`);
    }

    const extractData = await extractResponse.json();
    const documentContent = extractData.choices?.[0]?.message?.content;

    if (!documentContent) {
      throw new Error("No content extracted from document");
    }

    console.log(`Document content extracted (${documentContent.length} chars), generating study materials...`);

    // Generate flashcards and quiz in parallel
    const [flashcardsResponse, quizResponse] = await Promise.all([
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: `Based on this document content, generate 10 flashcards with clear questions and concise answers:\n\n${documentContent.substring(0, 15000)}`,
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
      }),
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: `Based on this document content, generate 5 multiple-choice questions with 4 options each:\n\n${documentContent.substring(0, 15000)}`,
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
      }),
    ]);

    // Parse flashcards
    let flashcardsCount = 0;
    if (flashcardsResponse.ok) {
      const flashcardsData = await flashcardsResponse.json();
      const toolCall = flashcardsData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const flashcards = JSON.parse(toolCall.function.arguments);
        const flashcardsToInsert = flashcards.flashcards.map((card: any) => ({
          user_id: userId,
          title: fileName,
          front: card.front,
          back: card.back,
          category: "academic",
          source_type: "document_generated",
        }));
        const { error: fcErr } = await supabase.from("flashcards").insert(flashcardsToInsert);
        if (fcErr) console.error("Error inserting flashcards:", fcErr);
        else flashcardsCount = flashcardsToInsert.length;
      }
    } else {
      console.error("Flashcards generation failed:", flashcardsResponse.status);
    }

    // Parse quiz
    let questionsCount = 0;
    if (quizResponse.ok) {
      const quizData = await quizResponse.json();
      const toolCall = quizData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const quiz = JSON.parse(toolCall.function.arguments);
        const { error: qErr } = await supabase.from("quizzes").insert({
          user_id: userId,
          title: `${fileName} Quiz`,
          description: `Quiz generated from ${fileName}`,
          questions: quiz.questions,
          source_type: "document_generated",
        });
        if (qErr) console.error("Error inserting quiz:", qErr);
        else questionsCount = quiz.questions.length;
      }
    } else {
      console.error("Quiz generation failed:", quizResponse.status);
    }

    console.log(`Done! ${flashcardsCount} flashcards, ${questionsCount} quiz questions created`);

    return new Response(
      JSON.stringify({ success: true, flashcardsCount, questionsCount }),
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
