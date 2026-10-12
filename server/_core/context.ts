import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getUserByOpenId, upsertUser } from "../db";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

async function authenticateGuestRequest(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  if (process.env.ALLOW_GUEST_AUTH !== "true") return null;
  const guestId = req.headers["x-guest-id"];
  if (typeof guestId !== "string" || !/^[a-zA-Z0-9_-]{8,80}$/.test(guestId)) return null;
  const openId = `guest:${guestId}`;
  await upsertUser({ openId, name: "Guest trader", loginMethod: "guest" });
  return getUserByOpenId(openId) as Promise<User | null>;
}

async function authenticateSupabaseRequest(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const authorization = req.headers.authorization;
  if (!url || !anonKey || !authorization?.startsWith("Bearer ")) return null;
  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: authorization } });
  if (!response.ok) return null;
  const identity = await response.json() as { id?: string; email?: string; user_metadata?: { full_name?: string; name?: string } };
  if (!identity.id) return null;
  const openId = `supabase:${identity.id}`;
  await upsertUser({ openId, email: identity.email ?? null, name: identity.user_metadata?.full_name || identity.user_metadata?.name || null, loginMethod: "supabase" });
  return getUserByOpenId(openId) as Promise<User | null>;
}

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  try { user = await authenticateGuestRequest(opts.req); } catch { user = null; }
  if (!user) {
    try { user = await authenticateSupabaseRequest(opts.req); } catch { user = null; }
  }
  if (!user) {
    try { user = await sdk.authenticateRequest(opts.req); } catch { user = null; }
  }
  return { req: opts.req, res: opts.res, user };
}
