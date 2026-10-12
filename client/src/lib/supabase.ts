import { createClient, type Session } from "@supabase/supabase-js";

export const isGuestMode = import.meta.env.VITE_GUEST_MODE === "true";
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = !isGuestMode && url && anonKey ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
export const isSupabaseConfigured = Boolean(supabase);
let currentSession: Session | null = null;

if (supabase) {
  void supabase.auth.getSession().then(({ data }) => { currentSession = data.session; });
  supabase.auth.onAuthStateChange((_event, session) => { currentSession = session; });
}

export const getSupabaseAccessToken = () => currentSession?.access_token ?? null;

export function getGuestId() {
  const key = "tradelog-guest-id";
  try {
    const stored = localStorage.getItem(key);
    if (stored) return stored;
    const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, id);
    return id;
  } catch {
    return "ephemeral-guest";
  }
}
