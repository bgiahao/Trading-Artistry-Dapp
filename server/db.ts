import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertTrade, InsertUser, Trade, trades, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!_db && connectionString) {
    try {
      _client = postgres(connectionString, { prepare: false, max: 5, idle_timeout: 20 });
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) if (user[field] !== undefined) values[field] = user[field] ?? null;
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: { name: values.name, email: values.email, loginMethod: values.loginMethod, role: values.role, lastSignedIn: values.lastSignedIn } });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listUserTrades(userId: number): Promise<Trade[]> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(trades).where(eq(trades.userId, userId)).orderBy(desc(trades.closedAt));
}

export async function createTrade(trade: InsertTrade): Promise<Trade> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const inserted = await db.insert(trades).values(trade).returning();
  if (!inserted[0]) throw new Error("Trade was not created");
  return inserted[0];
}

export async function createTrades(tradeRows: InsertTrade[]) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (tradeRows.length === 0) return [];
  await db.insert(trades).values(tradeRows);
  return listUserTrades(tradeRows[0].userId);
}

export async function updateTrade(userId: number, tradeId: number, trade: InsertTrade) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const { userId: _ignored, id: _id, createdAt: _createdAt, ...changes } = trade;
  await db.update(trades).set(changes).where(and(eq(trades.userId, userId), eq(trades.id, tradeId)));
  const updated = await db.select().from(trades).where(and(eq(trades.userId, userId), eq(trades.id, tradeId))).limit(1);
  if (!updated[0]) throw new Error("Trade was not found");
  return updated[0];
}

export async function deleteTrade(userId: number, tradeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(trades).where(and(eq(trades.userId, userId), eq(trades.id, tradeId)));
  return { success: true } as const;
}
