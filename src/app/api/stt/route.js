// app/api/stt/route.js
import OpenAI from "openai";

export const runtime = "nodejs"; // oder "edge" – beides geht hier

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio"); // kommt als Blob/File

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "No audio file" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      "🎤 STT Request - File type:",
      audioFile.type,
      "Size:",
      audioFile.size
    );

    // Stelle sicher, dass die Datei als WAV mit korrektem Namen gesendet wird
    const audioFileWithName = new File([audioFile], "audio.wav", {
      type: "audio/wav",
    });

    // OpenAI SDK akzeptiert File/Blob direkt
    const transcription = await openai.audio.transcriptions.create({
      file: audioFileWithName,
      model: "whisper-1",
      language: "de", // Deutsch für bessere Erkennung
    });

    console.log(
      "✅ STT erfolgreich:",
      transcription.text?.substring(0, 50) + "..."
    );

    return new Response(JSON.stringify({ text: transcription.text || "" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("STT error:", err);
    return new Response(JSON.stringify({ error: "STT failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
