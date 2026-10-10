import { double, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const trades = mysqlTable("trades", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  symbol: varchar("symbol", { length: 32 }).notNull(),
  assetType: mysqlEnum("assetType", ["Stocks", "Crypto", "Commodities/Futures"]).notNull(),
  direction: mysqlEnum("direction", ["Long", "Short"]).notNull(),
  entryPrice: double("entryPrice").notNull(),
  exitPrice: double("exitPrice").notNull(),
  positionSize: double("positionSize").notNull(),
  stopLoss: double("stopLoss").notNull(),
  takeProfit: double("takeProfit").notNull(),
  riskTradePct: double("riskTradePct").default(1).notNull(),
  setup: varchar("setup", { length: 80 }).notNull(),
  chartUrl: varchar("chartUrl", { length: 500 }),
  notes: text("notes"),
  openedAt: timestamp("openedAt").notNull(),
  closedAt: timestamp("closedAt").notNull(),
  riskAmount: double("riskAmount").notNull(),
  rrRatio: double("rrRatio").notNull(),
  pnl: double("pnl").notNull(),
  rMultiple: double("rMultiple").notNull(),
  result: mysqlEnum("result", ["win", "loss", "breakeven"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  userIdIdx: index("trades_user_id_idx").on(table.userId),
  closedAtIdx: index("trades_closed_at_idx").on(table.userId, table.closedAt),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;
