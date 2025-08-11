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

    // OpenAI SDK akzeptiert File/Blob direkt
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

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
