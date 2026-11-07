import { useAuth } from "@/_core/hooks/useAuth";
import { isGuestMode, isSupabaseConfigured } from "@/lib/supabase";
import SupabaseAuthModal from "./SupabaseAuthModal";
import { ReactNode } from "react";

export default function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (isGuestMode || (!isSupabaseConfigured && auth.user)) return <>{children}</>;
  if (!isSupabaseConfigured) return <div className="min-h-screen bg-[#050505] text-[#F3F4F6]"><SupabaseAuthModal /></div>;
  if (auth.loading) return <div className="flex min-h-screen items-center justify-center bg-[#050505] text-sm text-[#9CA3AF]">Đang xác thực tài khoản…</div>;
  if (!auth.user) return <div className="min-h-screen bg-[#050505] text-[#F3F4F6]"><SupabaseAuthModal /></div>;
  return <>{children}</>;
}
