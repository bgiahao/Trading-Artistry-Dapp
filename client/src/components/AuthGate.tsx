import { useAuth } from "@/_core/hooks/useAuth";
import { isGuestDemoEnabled, isGuestMode, isSupabaseConfigured, registerGuestCleanup } from "@/lib/supabase";
import SupabaseAuthModal from "./SupabaseAuthModal";
import { ReactNode, useEffect, useState } from "react";

export default function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [guestDemo, setGuestDemo] = useState(isGuestDemoEnabled);
  useEffect(() => { try { sessionStorage.removeItem("trading-artistry-guest-transition"); } catch {} return registerGuestCleanup(); }, []);
  if (isGuestMode || guestDemo || (!isSupabaseConfigured && auth.user)) return <><GuestBanner visible={guestDemo} />{children}</>;
  if (!isSupabaseConfigured) return <div className="min-h-screen bg-[#050505] text-[#F3F4F6]"><SupabaseAuthModal onGuest={() => { setGuestDemo(true); window.location.href = "/dashboard"; }} /></div>;
  if (auth.loading) return <div className="flex min-h-screen items-center justify-center bg-[#050505] text-sm text-[#9CA3AF]">Đang xác thực tài khoản…</div>;
  if (!auth.user) return <div className="min-h-screen bg-[#050505] text-[#F3F4F6]"><SupabaseAuthModal onGuest={() => { setGuestDemo(true); window.location.href = "/dashboard"; }} /></div>;
  return <>{children}</>;
}

function GuestBanner({ visible }: { visible: boolean }) { if (!visible) return null; return <div className="fixed right-4 top-4 z-[90] max-w-sm rounded-lg border border-[#7C5E10] bg-[#2A210C] px-4 py-3 text-xs text-[#FDE68A] shadow-xl"><p className="font-semibold">Bạn đang ở chế độ Nhà giao dịch Khách.</p><p className="mt-1 text-[#FCD34D]">Đăng ký tài khoản để lưu trữ dữ liệu vĩnh viễn.</p></div>; }
