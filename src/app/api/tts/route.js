import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { text, voice = "alloy" } = await req.json();

    console.log("🎤 TTS Request:", {
      voice,
      textPreview: text.substring(0, 50) + "...",
    });

    if (!text || text.trim().length === 0) {
      console.error("❌ TTS: Leerer Text");
      return new Response(JSON.stringify({ error: "Text required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const mp3 = await openai.audio.speech.create({
      model: "tts-1", // Schnellstes Modell
      voice: voice, // Dynamische Voice-Auswahl
      input: text,
      speed: 1.1, // Deutlich schneller sprechen für kürzere Antwortzeit
    });

    console.log("✅ TTS erfolgreich mit Voice:", voice);

    const buffer = Buffer.from(await mp3.arrayBuffer());
    console.log("🔊 Audio Buffer Größe:", buffer.length, "bytes");

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
    console.error("❌ TTS Error:", error);
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
