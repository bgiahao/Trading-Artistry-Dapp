import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { LockKeyhole, Mail, X } from "lucide-react";

type Props = { onClose?: () => void };

export default function SupabaseAuthModal({ onClose }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async () => {
    if (!supabase) return setMessage("Supabase Auth chưa được cấu hình.");
    if (!email.trim() || password.length < 6) return setMessage("Vui lòng nhập email hợp lệ và mật khẩu tối thiểu 6 ký tự.");
    setBusy(true); setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: email.split("@")[0] } } });
    setBusy(false);
    if (result.error) return setMessage(result.error.message);
    setMessage(mode === "login" ? "Đăng nhập thành công." : "Đăng ký thành công. Hãy kiểm tra email để xác nhận tài khoản nếu được yêu cầu.");
  };

  const google = async () => {
    if (!supabase) return setMessage("Supabase Auth chưa được cấu hình.");
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
    setBusy(false);
    if (error) setMessage(error.message);
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
    <div className="relative w-full max-w-md rounded-2xl border border-[#1F2430] bg-[#12141A] p-6 text-[#F3F4F6] shadow-2xl">
      {onClose && <button aria-label="Đóng" onClick={onClose} className="absolute right-4 top-4 rounded-md p-1 text-[#9CA3AF] hover:bg-[#1A1D24]"><X className="h-4 w-4" /></button>}
      <div className="mb-6 flex items-center gap-3"><img src="/trading-artistry-logo.svg" alt="Trading Artistry" className="h-11 w-11 object-contain" /><div><p className="text-lg font-semibold">Trading Artistry</p><p className="text-xs text-[#9CA3AF]">Không gian quản trị nhật ký giao dịch</p></div></div>
      <h1 className="text-2xl font-semibold">{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h1>
      <p className="mt-1 text-sm text-[#9CA3AF]">Dữ liệu giao dịch được gắn với tài khoản của riêng bạn.</p>
      <Button disabled={busy} onClick={google} className="mt-6 h-11 w-full border border-[#303744] bg-[#1A1D24] text-[#F3F4F6] hover:bg-[#232833]"><span className="mr-2 rounded bg-white px-1.5 py-0.5 text-sm font-bold text-[#4285F4]">G</span>Tiếp tục với Google</Button>
      <div className="my-5 flex items-center gap-3 text-[11px] text-[#6B7280]"><span className="h-px flex-1 bg-[#2A303B]" />HOẶC<span className="h-px flex-1 bg-[#2A303B]" /></div>
      <label className="mb-1 block text-xs text-[#9CA3AF]">Email</label><div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-[#6B7280]" /><Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="h-10 border-[#303744] bg-[#0B0D10] pl-9 text-[#F3F4F6]" /></div>
      <label className="mb-1 mt-4 block text-xs text-[#9CA3AF]">Mật khẩu</label><div className="relative"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-[#6B7280]" /><Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Tối thiểu 6 ký tự" className="h-10 border-[#303744] bg-[#0B0D10] pl-9 text-[#F3F4F6]" onKeyDown={e => e.key === "Enter" && void submit()} /></div>
      {message && <p className="mt-3 rounded-md border border-[#303744] bg-[#0B0D10] px-3 py-2 text-xs text-[#9CA3AF]">{message}</p>}
      <Button disabled={busy} onClick={() => void submit()} className="mt-5 h-11 w-full bg-[#22C55E] font-semibold text-[#050505] hover:bg-[#4ADE80]">{busy ? "Đang xử lý…" : mode === "login" ? "Đăng nhập bằng email" : "Đăng ký bằng email"}</Button>
      <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }} className="mt-4 w-full text-center text-xs text-[#22C55E] hover:underline">{mode === "login" ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}</button>
    </div>
  </div>;
}
