import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  const requestStartTime = Date.now();
  console.log("🔊 TTS API: Request startet...");

  try {
    const { text, voice = "alloy" } = await req.json();

    console.log("🎤 TTS Request:", {
      voice,
      textPreview: text.substring(0, 50) + "...",
      textLength: text.length,
    });

    if (!text || text.trim().length === 0) {
      console.error("❌ TTS: Leerer Text");
      return new Response(JSON.stringify({ error: "Text required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("🤖 OpenAI: TTS-Generierung startet...");
    const ttsStartTime = Date.now();

    const mp3 = await openai.audio.speech.create({
      model: "tts-1", // Schnellstes Modell
      voice: voice, // Dynamische Voice-Auswahl
      input: text,
      speed: 1.1, // Deutlich schneller sprechen für kürzere Antwortzeit
    });

    const ttsSpechDuration = Date.now() - ttsStartTime;
    console.log(
      `✅ OpenAI: TTS fertig in ${ttsSpechDuration}ms mit Voice: ${voice}`
    );

    const bufferStartTime = Date.now();
    const buffer = Buffer.from(await mp3.arrayBuffer());
    const bufferDuration = Date.now() - bufferStartTime;
    const totalDuration = Date.now() - requestStartTime;

    console.log(
      `🔊 Audio Buffer erstellt in ${bufferDuration}ms - Größe: ${buffer.length} bytes`
    );
    console.log(`🎉 TTS API: Request komplett in ${totalDuration}ms`);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    const errorDuration = Date.now() - requestStartTime;
    console.error(`❌ TTS Error nach ${errorDuration}ms:`, error);
    return new Response(
      JSON.stringify({
        error: "TTS generation failed",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
