import { startLogin } from "@/const";
import { isGuestMode, supabase, isSupabaseConfigured } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = { redirectOnUnauthenticated?: boolean; redirectPath?: string };

type Credentials = { email: string; password: string };

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();
  const [supabaseSessionReady, setSupabaseSessionReady] = useState(!isSupabaseConfigured || isGuestMode);
  const [supabaseUser, setSupabaseUser] = useState<{ email?: string; user_metadata?: { full_name?: string; name?: string } } | null>(null);
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false, enabled: true });
  const logoutMutation = trpc.auth.logout.useMutation({ onSuccess: () => { utils.auth.me.setData(undefined, null); } });

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => { if (active) { setSupabaseUser(data.session?.user ?? null); setSupabaseSessionReady(true); } });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { setSupabaseUser(session?.user ?? null); setSupabaseSessionReady(true); void utils.auth.me.invalidate(); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [utils]);

  const loginWithPassword = useCallback(async ({ email, password }: Credentials) => {
    if (!supabase) throw new Error("Supabase Auth chưa được cấu hình");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await utils.auth.me.invalidate();
  }, [utils]);

  const signUp = useCallback(async ({ email, password }: Credentials) => {
    if (!supabase) throw new Error("Supabase Auth chưa được cấu hình");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (supabase) await supabase.auth.signOut();
      else await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED") return;
      throw error;
    } finally {
      try { sessionStorage.removeItem("manus-cookie"); } catch {}
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    const user = meQuery.data ?? (supabaseUser ? { name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null, email: supabaseUser.email || null } : null);
    try { localStorage.setItem("manus-runtime-user-info", JSON.stringify(user)); } catch {}
    return { user, loading: meQuery.isLoading || logoutMutation.isPending || (isSupabaseConfigured && !supabaseSessionReady), error: meQuery.error ?? logoutMutation.error ?? null, isAuthenticated: Boolean(user) };
  }, [meQuery.data, meQuery.error, meQuery.isLoading, logoutMutation.error, logoutMutation.isPending, supabaseSessionReady, supabaseUser]);

  useEffect(() => {
    if (!redirectOnUnauthenticated || isSupabaseConfigured || isGuestMode) return;
    if (meQuery.isLoading || logoutMutation.isPending || state.user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;
    if (redirectPath) window.location.href = redirectPath; else startLogin();
  }, [redirectOnUnauthenticated, redirectPath, logoutMutation.isPending, meQuery.isLoading, state.user]);

  return { ...state, refresh: () => meQuery.refetch(), logout, loginWithPassword, signUp, supabaseEnabled: isSupabaseConfigured, guestEnabled: isGuestMode };
}
