// Realtime Speech-to-Text und Chat Streaming
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  console.log("🎙️ Realtime API: Streaming-Request startet...");

  try {
    const formData = await req.formData();
    const audioChunk = formData.get("audioChunk");
    const isFirst = formData.get("isFirst") === "true";
    const isLast = formData.get("isLast") === "true";
    const sessionId = formData.get("sessionId");

    if (!audioChunk) {
      return new Response(JSON.stringify({ error: "No audio chunk" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `🎤 Audio Chunk: ${audioChunk.size} bytes, first: ${isFirst}, last: ${isLast}`
    );

    // Für echtes Realtime würden wir hier:
    // 1. Audio-Chunks sammeln
    // 2. Bei ausreichend Daten → STT
    // 3. Partial Transcripts zurückgeben
    // 4. Bei isLast → Komplette Verarbeitung

    if (isLast) {
      console.log("🔄 Realtime: Finale Verarbeitung...");

      try {
        // 1. Speech-to-Text mit Whisper
        const whisperFormData = new FormData();
        whisperFormData.append("file", audioChunk, "audio.wav");
        whisperFormData.append("model", "whisper-1");
        whisperFormData.append("language", "de");

        const whisperResponse = await fetch(
          "https://api.openai.com/v1/audio/transcriptions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: whisperFormData,
          }
        );

        if (!whisperResponse.ok) {
          console.error("Whisper API Fehler:", await whisperResponse.text());
          throw new Error("Speech-to-Text fehlgeschlagen");
        }

        const whisperData = await whisperResponse.json();
        const transcript = whisperData.text || "";
        console.log("📝 Realtime Transcript:", transcript);

        if (!transcript.trim()) {
          return new Response(
            JSON.stringify({
              type: "final",
              transcript: "",
              chatResponse:
                "Ich habe Sie nicht verstanden. Bitte versuchen Sie es erneut.",
              audioResponse: null,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // 2. Chat mit OpenAI
        const chatResponse = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content:
                    "Du bist ein einfühlsamer Mental Coach. Antworte kurz, unterstützend und auf Deutsch.",
                },
                {
                  role: "user",
                  content: transcript,
                },
              ],
              max_tokens: 150,
              temperature: 0.7,
            }),
          }
        );

        if (!chatResponse.ok) {
          throw new Error("Chat API fehlgeschlagen");
        }

        const chatData = await chatResponse.json();
        const responseText =
          chatData.choices[0]?.message?.content ||
          "Entschuldigung, ich konnte keine Antwort generieren.";

        console.log("💬 Realtime Chat Response:", responseText);

        return new Response(
          JSON.stringify({
            type: "final",
            transcript: transcript,
            chatResponse: responseText,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
            },
          }
        );
      } catch (error) {
        console.error("❌ Realtime Processing Error:", error);
        return new Response(
          JSON.stringify({
            type: "final",
            transcript: "",
            chatResponse:
              "Es gab einen Fehler bei der Verarbeitung. Bitte versuchen Sie es erneut.",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // Partial Response
      return new Response(
        JSON.stringify({
          type: "partial",
          transcript: "Sprech...",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        }
      );
    }
  } catch (error) {
    console.error("❌ Realtime Error:", error);
    return new Response(
      JSON.stringify({
        error: "Realtime processing failed",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
