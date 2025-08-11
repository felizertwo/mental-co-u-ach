import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE;

// Validierung der URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

if (!url || typeof url !== "string" || !isValidUrl(url)) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL ist keine gültige URL:", url);
  console.error("Erwartet: https://xxx.supabase.co");
  throw new Error(
    "Supabase: NEXT_PUBLIC_SUPABASE_URL muss eine gültige URL sein (z.B. https://xxx.supabase.co)"
  );
}

if (!serviceKey || typeof serviceKey !== "string") {
  console.error("❌ SUPABASE_SERVICE_ROLE fehlt oder ist ungültig");
  throw new Error(
    "Supabase: SUPABASE_SERVICE_ROLE fehlt oder ist ungültig in .env.local"
  );
}

console.log("✅ Supabase URL:", url); // Debug-Ausgabe

// Singleton (dev-sicher)
let client = globalThis.__supabaseAdmin;
if (!client) {
  client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  globalThis.__supabaseAdmin = client;
}

export const supabaseAdmin = client;
