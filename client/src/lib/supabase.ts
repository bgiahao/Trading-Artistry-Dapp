import { createClient, type Session } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && anonKey ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
let currentSession: Session | null = null;

if (supabase) {
  void supabase.auth.getSession().then(({ data }) => { currentSession = data.session; });
  supabase.auth.onAuthStateChange((_event, session) => { currentSession = session; });
}

export const getSupabaseAccessToken = () => currentSession?.access_token ?? null;
export const isSupabaseConfigured = Boolean(supabase);
