import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  const { text, voice = "alloy" } = await req.json();

  console.log("🎤 TTS Request:", {
    voice,
    textPreview: text.substring(0, 50) + "...",
  });

  const mp3 = await openai.audio.speech.create({
    model: "tts-1", // Schnellstes Modell
    voice: voice, // Dynamische Voice-Auswahl
    input: text,
    speed: 1.1, // Deutlich schneller sprechen für kürzere Antwortzeit
  });

  console.log("✅ TTS erfolgreich mit Voice:", voice);

  const buffer = Buffer.from(await mp3.arrayBuffer());

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-cache", // Kein Caching für sofortige Antworten
    },
  });
}
