import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_TURNS = 6;
const SUMMARY_TRIGGER_EVERY = 4;

async function getOrCreateSessionByExternalId(externalId) {
  try {
    const { data: found } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .eq("external_id", externalId)
      .single();
    if (found) return found;

    const { data, error } = await supabaseAdmin
      .from("sessions")
      .insert({ external_id: externalId })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Session creation failed:", error);
    // Fallback: Erstelle eine temporäre Session
    return { id: externalId, external_id: externalId };
  }
}

async function getRecentTurns(sessionId, limitPairs = 3) {
  try {
    const { data } = await supabaseAdmin
      .from("messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(limitPairs * 2);
    return (data ?? []).reverse();
  } catch (error) {
    console.error("Failed to get recent turns:", error);
    return [];
  }
}

async function getSummary(sessionId) {
  try {
    const { data } = await supabaseAdmin
      .from("sessions")
      .select("summary")
      .eq("id", sessionId)
      .single();
    return data?.summary || "";
  } catch (error) {
    console.error("Failed to get summary:", error);
    return "";
  }
}

async function appendMessage(sessionId, role, content) {
  try {
    await supabaseAdmin
      .from("messages")
      .insert({ session_id: sessionId, role, content });
  } catch (error) {
    console.error("Failed to append message:", error);
    // Ignoriere den Fehler, die App funktioniert trotzdem
  }
}

async function countUserMessages(sessionId) {
  try {
    const { count } = await supabaseAdmin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("role", "user");
    return count || 0;
  } catch (error) {
    console.error("Failed to count messages:", error);
    return 0;
  }
}

async function summarizeAndStore(sessionId, turns, existingSummary) {
  try {
    const prompt = [
      {
        role: "system",
        content:
          "Fasse therapeutisch relevante Inhalte/Trigger/Bedürfnisse/Übungen/Nächste Schritte prägnant zusammen. Max 120 Wörter, gern Bulletpoints.",
      },
      {
        role: "user",
        content: turns
          .map((t) => `${t.role.toUpperCase()}: ${t.content}`)
          .join("\n"),
      },
    ];
    const sum = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: prompt,
      temperature: 0.2,
    });
    const text = sum.choices[0].message.content.trim();
    const newSummary = existingSummary
      ? `${existingSummary}\n\n— Update —\n${text}`
      : text;
    await supabaseAdmin
      .from("sessions")
      .update({ summary: newSummary })
      .eq("id", sessionId);
  } catch (error) {
    console.error("Failed to summarize and store:", error);
    // Ignoriere den Fehler, die App funktioniert trotzdem
  }
}

export async function POST(req) {
  try {
    const { message, sessionId: externalId, userId } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "message missing" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Session-ID fallback - verwende User-ID wenn verfügbar
    const sessionIdToUse =
      externalId && externalId !== "anonymous"
        ? externalId
        : "anonymous-session";

    // Hole Benutzerinformationen für personalisierte Antworten
    let userFirstName = null;
    if (userId) {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
          userId
        );
        userFirstName = userData?.user?.user_metadata?.first_name || null;
      } catch (error) {
        console.error("Failed to get user data:", error);
      }
    }

    // Versuche Datenbank-Operationen, aber lass die App funktionieren, auch wenn sie fehlschlagen
    const session = await getOrCreateSessionByExternalId(sessionIdToUse);
    const recent = await getRecentTurns(session.id, MAX_TURNS / 2);
    const summary = await getSummary(session.id);
    const userCount = await countUserMessages(session.id);

    const baseSystemContent = userFirstName
      ? `Du bist 'Co(u)ach', ein einfühlsamer Mental Coach. Der Benutzer heißt ${userFirstName}. Antworte KURZ (max 2-3 Sätze), aber warmherzig. Stelle eine präzise Frage oder gib einen konkreten Mini-Tipp. Arbeite lösungsorientiert. Bei Krisen: sofort professionelle Hilfe empfehlen.`
      : "Du bist 'Co(u)ach', ein einfühlsamer Mental Coach. Antworte KURZ (max 2-3 Sätze), aber warmherzig. Stelle eine präzise Frage oder gib einen konkreten Mini-Tipp. Arbeite lösungsorientiert. Bei Krisen: sofort professionelle Hilfe empfehlen.";

    const baseSystem = {
      role: "system",
      content: baseSystemContent,
    };

    const memorySystem = summary
      ? { role: "system", content: `Session-Memory (kurz):\n${summary}` }
      : null;

    const messages = [
      baseSystem,
      ...(memorySystem ? [memorySystem] : []),
      ...recent,
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.8, // Mehr Spontaneität
      max_tokens: 120, // Noch kürzere Antworten für Geschwindigkeit
      stream: false,
      presence_penalty: 0.1, // Weniger Wiederholungen
      frequency_penalty: 0.1, // Mehr Abwechslung
    });

    const reply = completion.choices[0].message.content;

    // Speichere in Datenbank (falls möglich)
    await appendMessage(session.id, "user", message);
    await appendMessage(session.id, "assistant", reply);

    // Periodisch zusammenfassen
    if (
      (userCount + 1) % SUMMARY_TRIGGER_EVERY === 0 ||
      recent.length >= MAX_TURNS
    ) {
      const latestTurns = await getRecentTurns(session.id, MAX_TURNS / 2);
      await summarizeAndStore(session.id, latestTurns, summary);
    }

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Chat processing failed",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
