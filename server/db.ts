import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertTrade, InsertUser, Trade, trades, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      const normalized = user[field] ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
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
  const result = await db.insert(trades).values(trade);
  const inserted = await db.select().from(trades).where(and(eq(trades.userId, trade.userId), eq(trades.id, result[0].insertId))).limit(1);
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

export async function deleteTrade(userId: number, tradeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(trades).where(and(eq(trades.userId, userId), eq(trades.id, tradeId)));
  return { success: true } as const;
}
