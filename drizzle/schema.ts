import { boolean, doublePrecision, index, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const assetTypeEnum = pgEnum("asset_type", ["Stocks", "Crypto", "Commodities/Futures"]);
export const directionEnum = pgEnum("direction", ["Long", "Short"]);
export const resultEnum = pgEnum("trade_result", ["win", "loss", "breakeven"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 128 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  symbol: varchar("symbol", { length: 32 }).notNull(),
  assetType: assetTypeEnum("asset_type").notNull(),
  direction: directionEnum("direction").notNull(),
  entryPrice: doublePrecision("entry_price").notNull(),
  exitPrice: doublePrecision("exit_price").notNull(),
  positionSize: doublePrecision("position_size").notNull(),
  stopLoss: doublePrecision("stop_loss").notNull(),
  takeProfit: doublePrecision("take_profit").notNull(),
  riskTradePct: doublePrecision("risk_trade_pct").default(1).notNull(),
  setup: varchar("setup", { length: 80 }).notNull(),
  chartUrl: varchar("chart_url", { length: 500 }),
  notes: text("notes"),
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }).notNull(),
  riskAmount: doublePrecision("risk_amount").notNull(),
  rrRatio: doublePrecision("rr_ratio").notNull(),
  pnl: doublePrecision("pnl").notNull(),
  rMultiple: doublePrecision("r_multiple").notNull(),
  result: resultEnum("result").notNull(),
  isComplete: boolean("is_complete").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  userIdIdx: index("trades_user_id_idx").on(table.userId),
  closedAtIdx: index("trades_closed_at_idx").on(table.userId, table.closedAt),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;
