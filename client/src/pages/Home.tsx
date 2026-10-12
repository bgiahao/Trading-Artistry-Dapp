import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import type { Trade } from "../../../drizzle/schema";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  Filter,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Moon,
  Pencil,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { isSupabaseConfigured } from "@/lib/supabase";

type View = "dashboard" | "journal" | "analytics";
type AssetType = "Stocks" | "Crypto" | "Commodities/Futures";
type Direction = "Long" | "Short";

type TradeForm = {
  symbol: string;
  assetType: AssetType;
  direction: Direction;
  entryPrice: string;
  exitPrice: string;
  positionSize: string;
  stopLoss: string;
  takeProfit: string;
  riskTradePct: string;
  setup: string;
  chartUrl: string;
  notes: string;
  openedAt: string;
  closedAt: string;
};

const SETUPS = ["VCP Breakout", "Trend Following", "Pullback", "CANSLIM", "Anti-Martingale", "Other"];
const ASSETS: AssetType[] = ["Stocks", "Crypto", "Commodities/Futures"];
const STARTING_CAPITAL = 10000;
const defaultDate = () => new Date().toISOString().slice(0, 16);
const emptyForm = (): TradeForm => ({
  symbol: "",
  assetType: "Stocks",
  direction: "Long",
  entryPrice: "",
  exitPrice: "",
  positionSize: "",
  stopLoss: "",
  takeProfit: "",
  riskTradePct: "1",
  setup: "VCP Breakout",
  chartUrl: "",
  notes: "",
  openedAt: defaultDate(),
  closedAt: defaultDate(),
});

const money = (value: number, digits = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value || 0);
const number = (value: number, digits = 2) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value || 0);
const pct = (value: number, digits = 1) => `${(value || 0).toFixed(digits)}%`;
const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function previewValues(form: TradeForm) {
  const entry = Number(form.entryPrice) || 0;
  const exit = Number(form.exitPrice) || 0;
  const size = Number(form.positionSize) || 0;
  const stop = Number(form.stopLoss) || 0;
  const target = Number(form.takeProfit) || 0;
  const riskAmount = Math.abs(entry - stop) * size;
  const rrRatio = Math.abs(target - entry) / Math.abs(entry - stop || 1);
  const pnl = form.direction === "Long" ? (exit - entry) * size : (entry - exit) * size;
  const rMultiple = riskAmount ? pnl / riskAmount : 0;
  const result = rMultiple > 0.05 ? "win" : rMultiple < -0.05 ? "loss" : "breakeven";
  return { riskAmount, rrRatio, pnl, rMultiple, result };
}

function initials(name?: string | null) {
  return (name || "Trader").split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
}

function selectClassName() {
  return "h-10 w-full rounded-xl border border-white/[0.09] bg-white/[0.035] px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/10";
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-white/[0.08] bg-[#101923]/90 shadow-[0_16px_50px_rgba(0,0,0,0.16)] ${className}`}>{children}</section>;
}

function MetricCard({ label, value, hint, tone = "cyan", icon: Icon, trend }: { label: string; value: string; hint: string; tone?: "cyan" | "green" | "amber" | "violet" | "red"; icon: typeof Target; trend?: "up" | "down" }) {
  const tones = {
    cyan: "text-cyan-300 bg-cyan-300/10 border-cyan-300/15",
    green: "text-emerald-300 bg-emerald-300/10 border-emerald-300/15",
    amber: "text-amber-300 bg-amber-300/10 border-amber-300/15",
    violet: "text-violet-300 bg-violet-300/10 border-violet-300/15",
    red: "text-rose-300 bg-rose-300/10 border-rose-300/15",
  };
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-3 truncate font-mono text-[25px] font-semibold tracking-[-0.04em] text-white">{value}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            {trend ? (trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" /> : <ArrowDownRight className="h-3.5 w-3.5 text-rose-300" />) : null}
            {hint}
          </p>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${tones[tone]}`}><Icon className="h-4 w-4" /></div>
      </div>
    </Card>
  );
}

function MiniTag({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "cyan" | "green" | "red" | "amber" }) {
  const classes = {
    slate: "bg-white/[0.055] text-slate-400 border-white/[0.08]",
    cyan: "bg-cyan-300/10 text-cyan-200 border-cyan-300/20",
    green: "bg-emerald-300/10 text-emerald-200 border-emerald-300/20",
    red: "bg-rose-300/10 text-rose-200 border-rose-300/20",
    amber: "bg-amber-300/10 text-amber-200 border-amber-300/20",
  };
  return <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-medium ${classes[tone]}`}>{children}</span>;
}

function LoginScreen({ loginWithPassword, signUp }: { loginWithPassword: (input: { email: string; password: string }) => Promise<void>; signUp: (input: { email: string; password: string }) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [pending, setPending] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setPending(true); try { if (isSignUp) { await signUp({ email, password }); toast.success("Đã tạo tài khoản. Hãy kiểm tra email để xác nhận."); } else await loginWithPassword({ email, password }); } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể đăng nhập"); } finally { setPending(false); } };
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080d13] px-5 text-slate-100">
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-cyan-400/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-violet-500/[0.06] blur-3xl" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0d151f] shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden min-h-[560px] flex-col justify-between border-r border-white/[0.08] p-10 lg:flex">
          <BrandMark />
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.24em] text-cyan-300">Trader operating system</p>
            <h1 className="max-w-lg text-5xl font-semibold leading-[1.04] tracking-[-0.06em] text-white">Trade with context.<br /><span className="text-cyan-300">Review with clarity.</span></h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">Ghi lại từng quyết định, đo lường rủi ro theo R và biến lịch sử giao dịch thành một lợi thế có thể lặp lại.</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" /> Private workspace · dữ liệu theo tài khoản</div>
        </div>
        <div className="flex min-h-[560px] flex-col justify-center p-7 sm:p-12">
          <div className="mb-10 lg:hidden"><BrandMark /></div>
          <div className="max-w-sm">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">Welcome back</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">Mở workspace của bạn</h2>
            <p className="mt-4 text-sm leading-6 text-slate-400">Đăng nhập để xem Dashboard, nhật ký giao dịch và các insight hiệu suất cá nhân.</p>
            {isSupabaseConfigured ? <form onSubmit={submit} className="mt-8 space-y-3"><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="h-12 rounded-xl border-white/[0.1] bg-white/[0.04]" /><Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mật khẩu" className="h-12 rounded-xl border-white/[0.1] bg-white/[0.04]" /><Button type="submit" disabled={pending} className="h-12 w-full rounded-xl bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200"><Sparkles className="mr-2 h-4 w-4" /> {pending ? "Đang xử lý..." : isSignUp ? "Đăng ký với Supabase" : "Đăng nhập với Supabase"}</Button><button type="button" onClick={() => setIsSignUp(value => !value)} className="w-full text-xs text-slate-500 hover:text-cyan-200">{isSignUp ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}</button></form> : <Button onClick={() => startLogin()} className="mt-8 h-12 w-full rounded-xl bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200"><Sparkles className="mr-2 h-4 w-4" /> Đăng nhập với Manus</Button>}
            <div className="mt-8 grid grid-cols-3 gap-2 text-center">
              {["Theo dõi R", "Equity Curve", "Import CSV"].map(item => <div key={item} className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-2 py-3 text-[10px] text-slate-500">{item}</div>)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function BrandMark() {
  return <div className="flex items-center gap-3"><div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10"><div className="h-3 w-3 rotate-45 border-2 border-cyan-300" /><span className="absolute h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,0.8)]" /></div><div><p className="font-mono text-sm font-bold tracking-[0.16em] text-white">TRADELOG</p><p className="text-[9px] uppercase tracking-[0.18em] text-slate-500">Journal / Analytics</p></div></div>;
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return <div className="flex min-h-[270px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015] px-6 text-center"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300"><BookOpen className="h-5 w-5" /></div><p className="text-sm font-medium text-slate-200">Workspace đang chờ giao dịch đầu tiên</p><p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">Thêm một lệnh để bắt đầu xây dựng equity curve và nhìn thấy setup nào thực sự tạo ra lợi thế.</p><Button onClick={onAdd} variant="outline" className="mt-5 h-9 rounded-lg border-cyan-300/25 bg-cyan-300/[0.07] text-xs text-cyan-200 hover:bg-cyan-300/15"><Plus className="mr-1.5 h-3.5 w-3.5" /> Ghi lệnh đầu tiên</Button></div>;
}

function formFromTrade(trade?: Trade): TradeForm {
  if (!trade) return emptyForm();
  const localDate = (value: Date | string) => new Date(value).toISOString().slice(0, 16);
  return { symbol: trade.symbol === "Untitled" ? "" : trade.symbol, assetType: trade.assetType, direction: trade.direction, entryPrice: trade.entryPrice ? String(trade.entryPrice) : "", exitPrice: trade.exitPrice ? String(trade.exitPrice) : "", positionSize: trade.positionSize ? String(trade.positionSize) : "", stopLoss: trade.stopLoss ? String(trade.stopLoss) : "", takeProfit: trade.takeProfit ? String(trade.takeProfit) : "", riskTradePct: String(trade.riskTradePct ?? 1), setup: trade.setup === "Unclassified" ? "VCP Breakout" : trade.setup, chartUrl: trade.chartUrl || "", notes: trade.notes || "", openedAt: localDate(trade.openedAt), closedAt: localDate(trade.closedAt) };
}

function TradeFormModal({ onClose, onSaved, trade }: { onClose: () => void; onSaved: () => void; trade?: Trade }) {
  const [form, setForm] = useState<TradeForm>(() => formFromTrade(trade));
  const preview = previewValues(form);
  const createTrade = trpc.trades.create.useMutation({ onSuccess: () => { toast.success("Đã lưu giao dịch vào nhật ký"); onSaved(); }, onError: error => toast.error(error.message || "Không thể lưu giao dịch") });
  const updateTrade = trpc.trades.update.useMutation({ onSuccess: () => { toast.success("Đã cập nhật giao dịch"); onSaved(); }, onError: error => toast.error(error.message || "Không thể cập nhật giao dịch") });
  const isSaving = createTrade.isPending || updateTrade.isPending;
  const update = (key: keyof TradeForm, value: string) => setForm(current => ({ ...current, [key]: value }));
  const toPayload = () => ({ symbol: form.symbol || undefined, assetType: form.assetType || undefined, direction: form.direction || undefined, entryPrice: form.entryPrice ? Number(form.entryPrice) : undefined, exitPrice: form.exitPrice ? Number(form.exitPrice) : undefined, positionSize: form.positionSize ? Number(form.positionSize) : undefined, stopLoss: form.stopLoss ? Number(form.stopLoss) : undefined, takeProfit: form.takeProfit ? Number(form.takeProfit) : undefined, riskTradePct: Number(form.riskTradePct) || 1, setup: form.setup || undefined, chartUrl: form.chartUrl || undefined, notes: form.notes || undefined, openedAt: form.openedAt ? new Date(form.openedAt) : undefined, closedAt: form.closedAt ? new Date(form.closedAt) : undefined });
  const submit = (event: FormEvent) => { event.preventDefault(); const data = toPayload(); if (trade) updateTrade.mutate({ id: trade.id, data }); else createTrade.mutate(data); };
  const field = (key: keyof TradeForm, label: string, type = "text", placeholder = "") => <label className="block"><span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">{label}</span><Input type={type} value={form[key]} onChange={e => update(key, e.target.value)} placeholder={placeholder} className="h-10 rounded-xl border-white/[0.09] bg-white/[0.035] text-sm text-slate-100 placeholder:text-slate-600" /></label>;
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="max-h-[94vh] w-full max-w-4xl overflow-auto rounded-t-3xl border border-white/[0.1] bg-[#0e1721] shadow-2xl sm:rounded-3xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-[#0e1721]/95 px-5 py-4 backdrop-blur sm:px-7"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300">{trade ? "Edit trade" : "Trade entry"}</p><h2 className="mt-1 text-lg font-semibold text-white">{trade ? "Hoàn thiện giao dịch" : "Ghi lại một quyết định giao dịch"}</h2><p className="mt-1 text-xs text-slate-500">Có thể lưu nháp và bổ sung dữ liệu sau.</p></div><button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.06] hover:text-white"><X className="h-5 w-5" /></button></div><form onSubmit={submit} className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_0.72fr]"><div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2">{field("symbol", "Symbol", "text", "NVDA / BTCUSDT")}<label className="block"><span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">Asset type</span><select className={selectClassName()} value={form.assetType} onChange={e => update("assetType", e.target.value)}>{ASSETS.map(asset => <option key={asset}>{asset}</option>)}</select></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">Position</span><div className="grid grid-cols-2 gap-2">{(["Long", "Short"] as Direction[]).map(direction => <button type="button" key={direction} onClick={() => update("direction", direction)} className={`h-10 rounded-xl border text-sm transition ${form.direction === direction ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200" : "border-white/[0.09] bg-white/[0.035] text-slate-500 hover:text-slate-300"}`}>{direction}</button>)}</div></label>{field("positionSize", "Position size", "number", "100")}</div><div className="grid gap-4 sm:grid-cols-2">{field("entryPrice", "Entry price", "number", "100.00")}{field("exitPrice", "Exit price", "number", "104.50")}{field("stopLoss", "Stop loss", "number", "97.00")}{field("takeProfit", "Take profit", "number", "106.00")}</div><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">Setup / model</span><select className={selectClassName()} value={form.setup} onChange={e => update("setup", e.target.value)}>{SETUPS.map(setup => <option key={setup}>{setup}</option>)}</select></label>{field("riskTradePct", "Risk / trade %", "number", "1.0")}</div><div className="grid gap-4 sm:grid-cols-2">{field("openedAt", "Opened at", "datetime-local")}{field("closedAt", "Closed at", "datetime-local")}</div><div>{field("chartUrl", "TradingView chart link", "url", "https://www.tradingview.com/chart/...")}<p className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-600"><Link2 className="h-3 w-3" /> Link được giữ riêng theo giao dịch của bạn</p></div><label className="block"><span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">Notes / emotion journal</span><Textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Bối cảnh, cảm xúc, điều gì đúng / sai trong thesis..." className="min-h-24 rounded-xl border-white/[0.09] bg-white/[0.035] text-sm text-slate-100 placeholder:text-slate-600" /></label></div><div className="space-y-4"><div className="rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.1] via-white/[0.02] to-transparent p-5"><div className="flex items-center gap-2 text-cyan-200"><Zap className="h-4 w-4" /><span className="text-xs font-medium uppercase tracking-[0.14em]">Live calculation</span></div><div className="mt-5 space-y-4"><div className="flex items-end justify-between border-b border-white/[0.08] pb-3"><span className="text-xs text-slate-500">$ Risk</span><span className="font-mono text-xl text-white">{money(preview.riskAmount, 2)}</span></div><div className="flex items-end justify-between border-b border-white/[0.08] pb-3"><span className="text-xs text-slate-500">Risk / Reward</span><span className="font-mono text-xl text-cyan-200">{number(preview.rrRatio, 2)}R</span></div><div className="flex items-end justify-between"><span className="text-xs text-slate-500">Projected PnL</span><span className={`font-mono text-xl ${preview.pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{preview.pnl >= 0 ? "+" : ""}{money(preview.pnl, 2)}</span></div></div></div><div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4 text-xs leading-5 text-amber-100/70">Chỉ khi điền đủ các trường giao dịch chính, lệnh mới chuyển thành <b className="text-amber-200">Completed</b> và được tính vào hiệu suất.</div><Button type="submit" disabled={isSaving} className="h-11 w-full rounded-xl bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">{isSaving ? "Đang lưu..." : trade ? "Cập nhật giao dịch" : "Lưu giao dịch nháp"}<Check className="ml-2 h-4 w-4" /></Button><Button type="button" onClick={onClose} variant="ghost" className="h-10 w-full rounded-xl text-slate-500 hover:bg-white/[0.05] hover:text-slate-200">Hủy</Button></div></form></div></div>;
}

function TopBar({ user, view, setView, onAdd, onImport, onExportCsv, onExportExcel, onLogout }: { user: { name?: string | null; email?: string | null }; view: View; setView: (view: View) => void; onAdd: () => void; onImport: () => void; onExportCsv: () => void; onExportExcel: () => void; onLogout: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [{ id: "dashboard" as View, label: "Overview", icon: LayoutDashboard }, { id: "journal" as View, label: "Trade Journal", icon: BookOpen }, { id: "analytics" as View, label: "Analytics", icon: BarChart3 }];
  return <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#080d13]/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"><div className="flex items-center gap-7"><BrandMark /><nav className="hidden items-center gap-1 md:flex">{nav.map(item => <button key={item.id} onClick={() => setView(item.id)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${view === item.id ? "bg-white/[0.08] text-white" : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"}`}><item.icon className="h-3.5 w-3.5" />{item.label}</button>)}</nav></div><div className="flex items-center gap-2"><div className="relative hidden sm:block"><button onClick={() => setMenuOpen(value => !value)} className="flex items-center gap-2 rounded-lg border border-white/[0.08] px-2 py-1.5 hover:bg-white/[0.05]"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-300/10 font-mono text-[10px] text-cyan-200">{initials(user.name)}</span><span className="max-w-24 truncate text-xs text-slate-400">{user.name || user.email || "Trader"}</span><ChevronDown className="h-3 w-3 text-slate-600" /></button>{menuOpen ? <div className="absolute right-0 top-11 w-44 rounded-xl border border-white/[0.1] bg-[#121c27] p-1.5 shadow-xl"><button onClick={onLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-white/[0.05] hover:text-rose-200"><LogOut className="h-3.5 w-3.5" /> Sign out</button></div> : null}</div><button onClick={onAdd} className="flex h-9 items-center gap-1.5 rounded-lg bg-cyan-300 px-3 text-xs font-semibold text-slate-950 transition hover:bg-cyan-200"><Plus className="h-3.5 w-3.5" /><span className="hidden xs:inline">New trade</span></button><div className="md:hidden"><button onClick={() => setMenuOpen(value => !value)} className="rounded-lg border border-white/[0.08] p-2 text-slate-400"><Menu className="h-4 w-4" /></button></div></div></div>{menuOpen ? <div className="border-t border-white/[0.07] bg-[#0b121b] px-4 py-2 md:hidden"><div className="grid grid-cols-3 gap-1">{nav.map(item => <button key={item.id} onClick={() => { setView(item.id); setMenuOpen(false); }} className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] ${view === item.id ? "bg-white/[0.07] text-cyan-200" : "text-slate-500"}`}><item.icon className="h-4 w-4" />{item.label}</button>)}</div><div className="mt-2 grid grid-cols-3 gap-1 border-t border-white/[0.07] pt-2"><button onClick={onImport} className="flex items-center justify-center gap-1 rounded-lg py-2 text-[10px] text-slate-400 hover:bg-white/[0.05]"><Upload className="h-3 w-3" /> Import</button><button onClick={onExportCsv} className="flex items-center justify-center gap-1 rounded-lg py-2 text-[10px] text-slate-400 hover:bg-white/[0.05]"><Download className="h-3 w-3" /> CSV</button><button onClick={onLogout} className="flex items-center justify-center gap-1 rounded-lg py-2 text-[10px] text-slate-400 hover:bg-white/[0.05]"><LogOut className="h-3 w-3" /> Logout</button></div></div> : null}</header>;
}

function Overview({ trades, onAdd }: { trades: Trade[]; onAdd: () => void }) {
  const metrics = useMemo(() => calculateMetrics(trades), [trades]);
  const equity = useMemo(() => buildEquity(trades), [trades]);
  const setupRows = useMemo(() => groupTrades(trades, "setup"), [trades]);
  const assetRows = useMemo(() => groupTrades(trades, "assetType"), [trades]);
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-300">Performance cockpit / 01</p><h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">Good morning, trader.</h1><p className="mt-2 text-sm text-slate-500">Tổng quan lợi thế của bạn, được tính từ {trades.length} giao dịch đã đóng.</p></div><div className="flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-300" /> Live from your journal <CalendarDays className="ml-2 h-3.5 w-3.5" /></div></div>{trades.length === 0 ? <EmptyState onAdd={onAdd} /> : <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><MetricCard label="Total PnL" value={`${metrics.pnl >= 0 ? "+" : ""}${money(metrics.pnl)}`} hint={`${metrics.pnlPct >= 0 ? "+" : ""}${pct(metrics.pnlPct)} vs starting capital`} tone={metrics.pnl >= 0 ? "green" : "red"} icon={CircleDollarSign} trend={metrics.pnl >= 0 ? "up" : "down"} /><MetricCard label="Win rate" value={pct(metrics.winRate)} hint={`${metrics.wins} wins / ${trades.length} closed`} tone="cyan" icon={Target} /><MetricCard label="Avg R:R" value={`${number(metrics.avgRR, 2)}R`} hint="Reward relative to risk" tone="violet" icon={SlidersHorizontal} /><MetricCard label="Expectancy" value={`${metrics.expectancy >= 0 ? "+" : ""}${number(metrics.expectancy, 2)}R`} hint="Expected value per trade" tone={metrics.expectancy >= 0 ? "amber" : "red"} icon={Zap} /><MetricCard label="Max drawdown" value={pct(metrics.maxDrawdown)} hint="Peak-to-trough equity" tone="red" icon={TrendingDown} /></div><div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]"><Card className="min-w-0 p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Equity curve</p><div className="mt-2 flex items-baseline gap-3"><span className="font-mono text-2xl font-semibold text-white">{money(metrics.pnl, 2)}</span><MiniTag tone={metrics.pnl >= 0 ? "green" : "red"}>{metrics.pnl >= 0 ? "▲ Positive edge" : "▼ Needs review"}</MiniTag></div></div><button className="rounded-lg p-2 text-slate-600 hover:bg-white/[0.05] hover:text-slate-300"><Settings2 className="h-4 w-4" /></button></div><div className="mt-6 h-[270px] w-full"> <ResponsiveContainer width="100%" height="100%"><AreaChart data={equity} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}><defs><linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#67e8f9" stopOpacity={0.24} /><stop offset="100%" stopColor="#67e8f9" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" /><XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={value => `$${value}`} /><Tooltip contentStyle={{ background: "#101923", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#e2e8f0", fontSize: 12 }} formatter={(value: number) => [money(value, 2), "Equity"]} /><Area type="monotone" dataKey="equity" stroke="#67e8f9" strokeWidth={2} fill="url(#equityFill)" dot={{ r: 3, fill: "#67e8f9", strokeWidth: 0 }} /></AreaChart></ResponsiveContainer></div><div className="mt-3 flex items-center justify-between text-[10px] text-slate-600"><span>Starting equity · $10,000</span><span>{trades.length} closed trades</span></div></Card><Card className="p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Outcome mix</p><p className="mt-2 text-sm text-slate-300">Your repeatable edge</p></div><Target className="h-4 w-4 text-cyan-300" /></div><div className="mt-8 flex justify-center"><div className="relative flex h-44 w-44 items-center justify-center rounded-full" style={{ background: `conic-gradient(#6ee7b7 0 ${metrics.winRate}%, #fb7185 ${metrics.winRate}% ${metrics.winRate + metrics.lossRate}%, #fbbf24 ${metrics.winRate + metrics.lossRate}% 100%)` }}><div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-[#101923]"><span className="font-mono text-3xl font-semibold text-white">{pct(metrics.winRate, 0)}</span><span className="text-[10px] uppercase tracking-widest text-slate-500">win rate</span></div></div></div><div className="mt-7 space-y-3">{[["Wins", metrics.wins, "bg-emerald-300", "text-emerald-300"], ["Losses", metrics.losses, "bg-rose-300", "text-rose-300"], ["Breakeven", metrics.breakevens, "bg-amber-300", "text-amber-300"]].map(([label, value, dot, color]) => <div key={label as string} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{label}</span><span className={`font-mono ${color}`}>{value}</span></div>)}</div></Card></div><div className="grid gap-6 lg:grid-cols-2"><ComparisonCard title="Setup performance" subtitle="Which model pays you back?" rows={setupRows} /><ComparisonCard title="Asset mix" subtitle="Where does your edge live?" rows={assetRows} /></div></>}</div>;
}

function ComparisonCard({ title, subtitle, rows }: { title: string; subtitle: string; rows: GroupRow[] }) {
  return <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-white/[0.07] p-5"><div><p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{title}</p><p className="mt-1 text-sm text-slate-300">{subtitle}</p></div><BarChart3 className="h-4 w-4 text-slate-600" /></div><div className="divide-y divide-white/[0.05]">{rows.length ? rows.map(row => <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_90px_66px] items-center gap-3 px-5 py-4"><div className="min-w-0"><div className="flex justify-between gap-3"><span className="truncate text-xs text-slate-300">{row.label}</span><span className={`font-mono text-xs ${row.pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{row.pnl >= 0 ? "+" : ""}{money(row.pnl)}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className={`h-full rounded-full ${row.pnl >= 0 ? "bg-cyan-300" : "bg-rose-300"}`} style={{ width: `${Math.min(100, Math.max(8, Math.abs(row.pnl) / Math.max(...rows.map(item => Math.abs(item.pnl)), 1) * 100))}%` }} /></div></div><span className="font-mono text-right text-xs text-slate-500">{row.count} trades</span><span className={`text-right font-mono text-xs ${row.winRate >= 50 ? "text-emerald-300" : "text-amber-300"}`}>{pct(row.winRate, 0)}</span></div>) : <div className="p-5 text-xs text-slate-600">Chưa có dữ liệu phân nhóm.</div>}</div></Card>;
}

function Journal({ trades, onAdd, onEdit, onDelete, onImport, onExportCsv, onExportExcel }: { trades: Trade[]; onAdd: () => void; onEdit: (trade: Trade) => void; onDelete: (id: number) => void; onImport: () => void; onExportCsv: () => void; onExportExcel: () => void }) {
  const [search, setSearch] = useState(""); const [asset, setAsset] = useState("all"); const [setup, setSetup] = useState("all"); const [result, setResult] = useState("all"); const [dateFrom, setDateFrom] = useState(""); const [dateTo, setDateTo] = useState("");
  const filtered = useMemo(() => trades.filter(trade => { const matchesSearch = !search || `${trade.symbol} ${trade.setup} ${trade.notes || ""}`.toLowerCase().includes(search.toLowerCase()); const closedDate = new Date(trade.closedAt).toISOString().slice(0, 10); return matchesSearch && (asset === "all" || trade.assetType === asset) && (setup === "all" || trade.setup === setup) && (result === "all" || trade.result === result) && (!dateFrom || closedDate >= dateFrom) && (!dateTo || closedDate <= dateTo); }), [trades, search, asset, setup, result, dateFrom, dateTo]);
  const setupOptions = Array.from(new Set(trades.map(trade => trade.setup)));
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-300">Trade journal / 02</p><h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Every trade tells a story.</h1><p className="mt-2 text-sm text-slate-500">Lưu nháp trước, hoàn thiện sau khi giao dịch đóng.</p></div><div className="flex flex-wrap gap-2"><Button onClick={onImport} variant="outline" className="h-9 rounded-lg border-white/[0.1] bg-white/[0.025] text-xs text-slate-300"><Upload className="mr-1.5 h-3.5 w-3.5" /> Import</Button><Button onClick={onExportCsv} variant="outline" className="h-9 rounded-lg border-white/[0.1] bg-white/[0.025] text-xs text-slate-300"><Download className="mr-1.5 h-3.5 w-3.5" /> CSV</Button><Button onClick={onExportExcel} variant="outline" className="hidden h-9 rounded-lg border-white/[0.1] bg-white/[0.025] text-xs text-slate-300 sm:flex"><FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Excel</Button><Button onClick={onAdd} className="h-9 rounded-lg bg-cyan-300 text-xs font-semibold text-slate-950"><Plus className="mr-1.5 h-3.5 w-3.5" /> New trade</Button></div></div><Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-white/[0.07] p-4 lg:flex-row lg:items-center"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search symbol, setup, notes..." className="h-10 rounded-xl border-white/[0.08] bg-white/[0.035] pl-9 text-xs text-slate-100 placeholder:text-slate-600" /></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5"><select value={asset} onChange={e => setAsset(e.target.value)} className={`${selectClassName()} h-10 text-xs`}><option value="all">All assets</option>{ASSETS.map(item => <option key={item}>{item}</option>)}</select><select value={setup} onChange={e => setSetup(e.target.value)} className={`${selectClassName()} h-10 text-xs`}><option value="all">All setups</option>{setupOptions.map(item => <option key={item}>{item}</option>)}</select><select value={result} onChange={e => setResult(e.target.value)} className={`${selectClassName()} h-10 text-xs`}><option value="all">All results</option><option value="win">Win</option><option value="loss">Loss</option><option value="breakeven">Flat</option></select><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} aria-label="From date" className="h-10 rounded-xl border-white/[0.08] bg-white/[0.035] text-xs text-slate-400" /><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} aria-label="To date" className="h-10 rounded-xl border-white/[0.08] bg-white/[0.035] text-xs text-slate-400" /></div></div><div className="overflow-x-auto">{filtered.length ? <table className="w-full min-w-[900px] text-left"><thead className="bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-slate-600"><tr><th className="px-5 py-3 font-medium">Trade</th><th className="px-4 py-3 font-medium">Setup</th><th className="px-4 py-3 font-medium">Entry → Exit</th><th className="px-4 py-3 font-medium">Risk / R:R</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">PnL</th><th className="px-5 py-3 text-right font-medium"> </th></tr></thead><tbody className="divide-y divide-white/[0.05]">{filtered.map(trade => <tr key={trade.id} className="group transition hover:bg-white/[0.025]"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono text-[10px] font-bold ${trade.direction === "Long" ? "bg-emerald-300/10 text-emerald-300" : "bg-violet-300/10 text-violet-300"}`}>{trade.direction === "Long" ? "L" : "S"}</div><div><div className="flex items-center gap-2"><span className="font-mono text-sm font-semibold text-white">{trade.symbol}</span><MiniTag>{trade.assetType === "Commodities/Futures" ? "Futures" : trade.assetType}</MiniTag></div><p className="mt-1 text-[10px] text-slate-600">{new Date(trade.closedAt).toLocaleDateString("en-GB")}</p></div></div></td><td className="px-4 py-4 text-xs text-slate-400">{trade.setup}</td><td className="px-4 py-4 font-mono text-xs text-slate-500">{trade.isComplete ? `${number(trade.entryPrice, 2)} → ${number(trade.exitPrice, 2)}` : "—"}</td><td className="px-4 py-4"><div className="font-mono text-xs text-slate-400">{trade.isComplete ? money(trade.riskAmount, 2) : "—"}</div><div className="mt-1 text-[10px] text-slate-600">{trade.isComplete ? `${number(trade.rrRatio, 2)}R planned` : "Complete fields to calculate"}</div></td><td className="px-4 py-4">{trade.isComplete ? <MiniTag tone={trade.result === "win" ? "green" : trade.result === "loss" ? "red" : "amber"}>{titleCase(trade.result)} · {trade.rMultiple >= 0 ? "+" : ""}{number(trade.rMultiple, 2)}R</MiniTag> : <MiniTag tone="amber">Draft · excluded</MiniTag>}</td><td className={`px-4 py-4 text-right font-mono text-sm ${trade.isComplete && trade.pnl >= 0 ? "text-emerald-300" : "text-slate-600"}`}>{trade.isComplete ? `${trade.pnl >= 0 ? "+" : ""}${money(trade.pnl, 2)}` : "—"}</td><td className="px-5 py-4 text-right"><div className="flex justify-end gap-1"><button onClick={() => onEdit(trade)} className="rounded-lg p-2 text-slate-600 transition hover:bg-cyan-300/10 hover:text-cyan-200" aria-label="Edit trade"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => onDelete(trade.id)} className="rounded-lg p-2 text-slate-700 transition hover:bg-rose-300/10 hover:text-rose-300" aria-label="Delete trade"><X className="h-3.5 w-3.5" /></button></div></td></tr>)}</tbody></table> : <div className="p-12 text-center"><Search className="mx-auto h-5 w-5 text-slate-700" /><p className="mt-3 text-sm text-slate-400">Không tìm thấy giao dịch phù hợp.</p></div>}</div><div className="flex items-center justify-between border-t border-white/[0.07] px-5 py-3 text-[10px] text-slate-600"><span>{filtered.length} of {trades.length} trades</span><span>Drafts are excluded from performance</span></div></Card></div>;
}
function Analytics({ trades }: { trades: Trade[] }) {
  const setupRows = useMemo(() => groupTrades(trades, "setup"), [trades]);
  const assetRows = useMemo(() => groupTrades(trades, "assetType"), [trades]);
  const rDistribution = useMemo(() => {
    const buckets = [{ label: "≤ -2R", min: -Infinity, max: -2 }, { label: "-2R → -1R", min: -2, max: -1 }, { label: "-1R → 0", min: -1, max: 0 }, { label: "0 → +1R", min: 0, max: 1 }, { label: "+1R → +2R", min: 1, max: 2 }, { label: "≥ +2R", min: 2, max: Infinity }];
    return buckets.map(bucket => ({ ...bucket, count: trades.filter(trade => trade.rMultiple >= bucket.min && trade.rMultiple < bucket.max).length }));
  }, [trades]);
  return <div className="space-y-6"><div><p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-300">Analytics lab / 03</p><h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Find the pattern.</h1><p className="mt-2 text-sm text-slate-500">So sánh payoff, consistency và phân phối R trước khi bạn size up.</p></div>{trades.length === 0 ? <EmptyState onAdd={() => undefined} /> : <><div className="grid gap-6 xl:grid-cols-[1fr_1fr]"><Card className="p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">R distribution</p><p className="mt-1 text-sm text-slate-300">Bạn đang trả / nhận rủi ro như thế nào?</p></div><TrendingUp className="h-4 w-4 text-emerald-300" /></div><div className="mt-7 flex h-48 items-end gap-2 sm:gap-4">{rDistribution.map(bucket => <div key={bucket.label} className="flex min-w-0 flex-1 flex-col items-center gap-2"><div className="flex h-36 w-full items-end"><div className={`w-full rounded-t-md ${bucket.min >= 0 ? "bg-emerald-300/60" : "bg-rose-300/55"}`} style={{ height: `${Math.max(8, bucket.count / Math.max(...rDistribution.map(item => item.count), 1) * 100)}%` }} /></div><span className="truncate text-[9px] text-slate-600">{bucket.label}</span><span className="font-mono text-[10px] text-slate-400">{bucket.count}</span></div>)}</div></Card><Card className="p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Cumulative R</p><p className="mt-1 text-sm text-slate-300">Expectancy over your sample</p></div><CircleDollarSign className="h-4 w-4 text-cyan-300" /></div><div className="mt-6 h-52"><ResponsiveContainer width="100%" height="100%"><LineChart data={buildEquity(trades).map((row, index) => ({ ...row, r: trades.slice(0, index + 1).reduce((sum, trade) => sum + trade.rMultiple, 0) }))} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" /><XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={value => `${value}R`} /><Tooltip contentStyle={{ background: "#101923", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#e2e8f0", fontSize: 12 }} formatter={(value: number) => [`${number(value, 2)}R`, "Cumulative R"]} /><Line type="monotone" dataKey="r" stroke="#a78bfa" strokeWidth={2} dot={{ r: 2, fill: "#a78bfa", strokeWidth: 0 }} /></LineChart></ResponsiveContainer></div></Card></div><div className="grid gap-6 lg:grid-cols-2"><ComparisonCard title="Setup breakdown" subtitle="PnL and win rate by model" rows={setupRows} /><ComparisonCard title="Asset breakdown" subtitle="Stocks vs Crypto vs Futures" rows={assetRows} /></div></>}</div>;
}

type GroupRow = { label: string; pnl: number; winRate: number; count: number };
function groupTrades(trades: Trade[], key: "setup" | "assetType"): GroupRow[] {
  const groups = new Map<string, Trade[]>();
  for (const trade of trades) groups.set(String(trade[key]), [...(groups.get(String(trade[key])) || []), trade]);
  return [...groups.entries()].map(([label, rows]) => ({ label, pnl: rows.reduce((sum, row) => sum + row.pnl, 0), winRate: rows.length ? rows.filter(row => row.result === "win").length / rows.length * 100 : 0, count: rows.length })).sort((a, b) => b.pnl - a.pnl);
}

function buildEquity(trades: Trade[]) {
  let running = STARTING_CAPITAL;
  return [...trades].sort((a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime()).map(trade => { running += trade.pnl; return { label: new Date(trade.closedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }), equity: Number(running.toFixed(2)) }; });
}

function calculateMetrics(trades: Trade[]) {
  const pnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const wins = trades.filter(trade => trade.result === "win").length;
  const losses = trades.filter(trade => trade.result === "loss").length;
  const breakevens = trades.filter(trade => trade.result === "breakeven").length;
  const avgRR = trades.length ? trades.reduce((sum, trade) => sum + trade.rrRatio, 0) / trades.length : 0;
  const expectancy = trades.length ? trades.reduce((sum, trade) => sum + trade.rMultiple, 0) / trades.length : 0;
  let equity = STARTING_CAPITAL; let peak = STARTING_CAPITAL; let maxDrawdown = 0;
  for (const trade of [...trades].sort((a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime())) { equity += trade.pnl; peak = Math.max(peak, equity); if (peak > 0) maxDrawdown = Math.max(maxDrawdown, (peak - equity) / peak * 100); }
  return { pnl, pnlPct: pnl / STARTING_CAPITAL * 100, wins, losses, breakevens, winRate: trades.length ? wins / trades.length * 100 : 0, lossRate: trades.length ? losses / trades.length * 100 : 0, avgRR, expectancy, maxDrawdown };
}

function toPayload(row: Record<string, string>) {
  const get = (...keys: string[]) => { const key = Object.keys(row).find(item => keys.includes(item.toLowerCase().replace(/[^a-z0-9]/g, ""))); return key ? row[key] : ""; };
  const assetValue = get("assettype", "asset", "loaitaisan").toLowerCase();
  const directionValue = get("direction", "position", "vitrhe").toLowerCase();
  const num = (...keys: string[]) => Number(get(...keys).replace(/[$,]/g, "")) || 0;
  return { symbol: get("symbol", "ticker", "ma"), assetType: assetValue.includes("crypto") ? "Crypto" as AssetType : assetValue.includes("future") || assetValue.includes("commod") ? "Commodities/Futures" as AssetType : "Stocks" as AssetType, direction: directionValue.includes("short") ? "Short" as Direction : "Long" as Direction, entryPrice: num("entryprice", "entry"), exitPrice: num("exitprice", "exit"), positionSize: num("positionsize", "size", "quantity", "volume"), stopLoss: num("stoploss", "stop"), takeProfit: num("takeprofit", "target"), riskTradePct: num("risktradepct", "riskpct", "risk") || 1, setup: get("setup", "strategy", "model") || "Other", chartUrl: get("charturl", "chart", "tradingview"), notes: get("notes", "journal", "emotion"), openedAt: new Date(get("openedat", "opendate", "date") || Date.now()), closedAt: new Date(get("closedat", "closedate", "date") || Date.now()) };
}

export default function Home() {
  const { loading, user, logout, loginWithPassword, signUp } = useAuth();
  const [location, setLocation] = useLocation();
  const routeView: View = location === "/journal" ? "journal" : location === "/analytics" ? "analytics" : "dashboard";
  const [view, setView] = useState<View>(routeView);
  useEffect(() => setView(routeView), [routeView]);
  const changeView = (nextView: View) => { setView(nextView); setLocation(nextView === "dashboard" ? "/" : `/${nextView}`); };
  const [formOpen, setFormOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>();
  const importRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const tradesQuery = trpc.trades.list.useQuery(undefined, { enabled: Boolean(user), refetchOnWindowFocus: false });
  const importTrades = trpc.trades.importMany.useMutation({ onSuccess: () => { toast.success("Đã import giao dịch vào nhật ký"); void utils.trades.list.invalidate(); }, onError: error => toast.error(error.message || "Import thất bại") });
  const deleteTrade = trpc.trades.delete.useMutation({ onSuccess: () => { toast.success("Đã xóa giao dịch"); void utils.trades.list.invalidate(); }, onError: error => toast.error(error.message || "Không thể xóa giao dịch") });
  const trades = tradesQuery.data || [];
  const completedTrades = useMemo(() => trades.filter(trade => trade.isComplete), [trades]);
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#080d13] text-cyan-300"><div className="flex items-center gap-3 text-xs"><span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" /> Loading private workspace...</div></div>;
  if (!user) return <LoginScreen loginWithPassword={loginWithPassword} signUp={signUp} />;
  const exportRows = () => trades.map(trade => ({ Symbol: trade.symbol, Asset: trade.assetType, Direction: trade.direction, Entry: trade.entryPrice, Exit: trade.exitPrice, Size: trade.positionSize, StopLoss: trade.stopLoss, TakeProfit: trade.takeProfit, Risk: trade.riskAmount, RR: trade.rrRatio, PnL: trade.pnl, R: trade.rMultiple, Result: trade.result, Setup: trade.setup, OpenedAt: new Date(trade.openedAt).toISOString(), ClosedAt: new Date(trade.closedAt).toISOString(), Notes: trade.notes || "", ChartUrl: trade.chartUrl || "" }));
  const download = (name: string, content: string, type: string) => { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url); };
  const csvEscape = (value: unknown) => { const text = String(value ?? ""); return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; };
  const exportCsv = () => { const rows = exportRows(); const headers = rows.length ? Object.keys(rows[0]) : ["Symbol", "Asset", "Direction", "Entry", "Exit", "Size", "StopLoss", "TakeProfit", "Risk", "RR", "PnL", "R", "Result", "Setup", "OpenedAt", "ClosedAt", "Notes", "ChartUrl"]; download("tradelog-export.csv", [headers.join(","), ...rows.map(row => headers.map(header => csvEscape(row[header as keyof typeof row])).join(","))].join("\n"), "text/csv;charset=utf-8"); toast.success("Đã tải file CSV"); };
  const exportExcel = () => { const rows = exportRows(); const headers = rows.length ? Object.keys(rows[0]) : ["Symbol", "Asset", "Direction", "Entry", "Exit", "Size", "StopLoss", "TakeProfit", "Risk", "RR", "PnL", "R", "Result", "Setup", "OpenedAt", "ClosedAt", "Notes", "ChartUrl"]; const html = `<table><thead><tr>${headers.map(header => `<th>${header}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${headers.map(header => `<td>${String(row[header as keyof typeof row] ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")}</td>`).join("")}</tr>`).join("")}</tbody></table>`; download("tradelog-export.xls", `<!doctype html><html><meta charset="utf-8"><body>${html}</body></html>`, "application/vnd.ms-excel"); toast.success("Đã tải file Excel-compatible"); };
  const onImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; const text = await file.text(); let rows: Record<string, string>[] = []; if (text.trim().startsWith("<")) { const doc = new DOMParser().parseFromString(text, "text/html"); const tableRows = Array.from(doc.querySelectorAll("tr")).map(row => Array.from(row.querySelectorAll("th,td")).map(cell => cell.textContent?.trim() || "")); const [headers, ...body] = tableRows; rows = body.map(row => Object.fromEntries((headers || []).map((header, index) => [header, row[index] || ""]))); } else { const lines = text.split(/\r?\n/).filter(Boolean); const delimiter = lines[0]?.includes("\t") ? "\t" : ","; const parse = (line: string) => { const values: string[] = []; let current = ""; let quoted = false; for (let index = 0; index < line.length; index += 1) { const char = line[index]; if (char === '"' && line[index + 1] === '"') { current += '"'; index += 1; } else if (char === '"') quoted = !quoted; else if (char === delimiter && !quoted) { values.push(current); current = ""; } else current += char; } values.push(current); return values; }; const [headers, ...body] = lines.map(parse); rows = body.map(row => Object.fromEntries((headers || []).map((header, index) => [header, row[index] || ""]))); } const payload = rows.map(toPayload).filter(row => row.symbol && row.entryPrice && row.exitPrice && row.positionSize && row.stopLoss && row.takeProfit); if (!payload.length) { toast.error("Không đọc được dòng giao dịch hợp lệ"); return; } importTrades.mutate(payload); };
  return <div className="min-h-screen bg-[#080d13] text-slate-100"><TopBar user={user} view={view} setView={changeView} onAdd={() => { setEditingTrade(undefined); setFormOpen(true); }} onImport={() => importRef.current?.click()} onExportCsv={exportCsv} onExportExcel={exportExcel} onLogout={() => void logout()} /><input ref={importRef} type="file" className="hidden" accept=".csv,.tsv,.xls,.html,text/csv" onChange={onImportFile} /><main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8">{tradesQuery.isLoading ? <div className="flex min-h-[400px] items-center justify-center text-xs text-slate-500">Loading your trades...</div> : view === "dashboard" ? <Overview trades={completedTrades} onAdd={() => { setEditingTrade(undefined); setFormOpen(true); }} /> : view === "journal" ? <Journal trades={trades} onEdit={trade => { setEditingTrade(trade); setFormOpen(true); }} onAdd={() => { setEditingTrade(undefined); setFormOpen(true); }} onDelete={id => deleteTrade.mutate({ id })} onImport={() => importRef.current?.click()} onExportCsv={exportCsv} onExportExcel={exportExcel} /> : <Analytics trades={completedTrades} />}</main>{formOpen ? <TradeFormModal trade={editingTrade} onClose={() => { setFormOpen(false); setEditingTrade(undefined); }} onSaved={() => { setFormOpen(false); setEditingTrade(undefined); void utils.trades.list.invalidate(); }} /> : null}<footer className="mx-auto flex max-w-[1440px] items-center justify-between px-4 pb-7 text-[10px] text-slate-700 sm:px-6 lg:px-8"><span>TRADELOG / PRIVATE WORKSPACE</span><span className="flex items-center gap-1"><Moon className="h-3 w-3" /> Dark mode by default</span></footer></div>;
}
