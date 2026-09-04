import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fails loudly instead of a confusing blank screen if .env isn't set up.
  throw new Error(
    "Missing Supabase env vars. Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(url, anonKey);

// Every account logs in with phone + password, but Supabase Auth is
// email-based, so we build a synthetic email from the phone number.
export function phoneToEmail(phone) {
  return `${phone.trim()}@internal.local`;
}
