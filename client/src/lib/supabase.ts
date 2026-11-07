import { createClient, type Session } from "@supabase/supabase-js";

export const isGuestMode = import.meta.env.VITE_GUEST_MODE === "true";
const GUEST_DEMO_KEY = "trading-artistry-guest-demo";
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

export function isGuestDemoEnabled() {
  try { return localStorage.getItem(GUEST_DEMO_KEY) === "true"; } catch { return false; }
}

export function enableGuestDemo() {
  clearGuestDemoData();
  try { localStorage.setItem(GUEST_DEMO_KEY, "true"); sessionStorage.setItem("trading-artistry-guest-transition", "true"); } catch { /* private browsing */ }
}

export function clearGuestDemoData() {
  try {
    [GUEST_DEMO_KEY, "tradelog-guest-id", "ta-redesign-trades", "ta-trades", "ta-accounts", "ta-selected-accounts", "ta-active-account", "ta-initial-capital", "ta-strategies", "ta-base-patterns", "ta-default-risk-pct", "ta-default-currency"].forEach(key => localStorage.removeItem(key));
    sessionStorage.removeItem(GUEST_DEMO_KEY);
  } catch { /* storage unavailable */ }
}

export function registerGuestCleanup() {
  if (typeof window === "undefined") return () => {};
  const cleanup = () => { try { if (sessionStorage.getItem("trading-artistry-guest-transition") === "true") return; } catch {} if (isGuestDemoEnabled()) clearGuestDemoData(); };
  window.addEventListener("beforeunload", cleanup);
  return () => window.removeEventListener("beforeunload", cleanup);
}

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
