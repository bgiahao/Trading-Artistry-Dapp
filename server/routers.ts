import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createTrade, createTrades, deleteTrade, listUserTrades, updateTrade } from "./db";

const assetTypeSchema = z.enum(["Stocks", "Crypto", "Commodities/Futures"]);
const directionSchema = z.enum(["Long", "Short"]);
const tradeInputSchema = z.object({
  symbol: z.string().trim().max(32).optional().default(""),
  assetType: assetTypeSchema.optional(),
  direction: directionSchema.optional(),
  entryPrice: z.number().positive().optional(),
  exitPrice: z.number().positive().optional(),
  positionSize: z.number().positive().optional(),
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
  riskTradePct: z.number().min(0).max(100).optional().default(1),
  setup: z.string().trim().max(80).optional().default(""),
  chartUrl: z.string().trim().max(500).optional().or(z.literal("")),
  notes: z.string().max(5000).optional(),
  openedAt: z.coerce.date().optional(),
  closedAt: z.coerce.date().optional(),
});

type TradeInput = z.infer<typeof tradeInputSchema>;
const isCompleteInput = (input: TradeInput) => Boolean(input.symbol && input.assetType && input.direction && input.entryPrice && input.exitPrice && input.positionSize && input.stopLoss && input.takeProfit && input.setup && input.openedAt && input.closedAt);

function deriveTrade(input: TradeInput, userId: number) {
  const complete = isCompleteInput(input);
  if (complete) {
    if (input.closedAt! < input.openedAt!) throw new TRPCError({ code: "BAD_REQUEST", message: "Closed time must be after opened time" });
    if (input.entryPrice === input.stopLoss) throw new TRPCError({ code: "BAD_REQUEST", message: "Stop loss must be different from entry price" });
    const directionIsValid = input.direction === "Long" ? input.stopLoss! < input.entryPrice! && input.takeProfit! > input.entryPrice! : input.stopLoss! > input.entryPrice! && input.takeProfit! < input.entryPrice!;
    if (!directionIsValid) throw new TRPCError({ code: "BAD_REQUEST", message: "Stop loss and take profit are on the wrong side for this position" });
  }
  const entry = input.entryPrice ?? 0;
  const exit = input.exitPrice ?? 0;
  const size = input.positionSize ?? 0;
  const stop = input.stopLoss ?? 0;
  const target = input.takeProfit ?? 0;
  const riskAmount = complete ? Math.abs(entry - stop) * size : 0;
  const rrRatio = complete ? Math.abs(target - entry) / Math.abs(entry - stop) : 0;
  const pnl = complete ? (input.direction === "Long" ? (exit - entry) * size : (entry - exit) * size) : 0;
  const rMultiple = riskAmount > 0 ? pnl / riskAmount : 0;
  const result = rMultiple > 0.05 ? "win" : rMultiple < -0.05 ? "loss" : "breakeven";
  return {
    userId, symbol: input.symbol || "Untitled", assetType: input.assetType || "Stocks", direction: input.direction || "Long", entryPrice: entry, exitPrice: exit, positionSize: size, stopLoss: stop, takeProfit: target,
    riskTradePct: input.riskTradePct ?? 1, setup: input.setup || "Unclassified", chartUrl: input.chartUrl || null, notes: input.notes || null, openedAt: input.openedAt || new Date(), closedAt: input.closedAt || new Date(), riskAmount, rrRatio, pnl, rMultiple, result, isComplete: complete,
  } as const;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  trades: router({
    list: protectedProcedure.query(({ ctx }) => listUserTrades(ctx.user.id)),
    create: protectedProcedure.input(tradeInputSchema).mutation(({ ctx, input }) => createTrade(deriveTrade(input, ctx.user.id))),
    importMany: protectedProcedure.input(z.array(tradeInputSchema).max(500)).mutation(({ ctx, input }) => createTrades(input.map(row => deriveTrade(row, ctx.user.id)))),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: tradeInputSchema })).mutation(({ ctx, input }) => updateTrade(ctx.user.id, input.id, deriveTrade(input.data, ctx.user.id))),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteTrade(ctx.user.id, input.id)),
  }),
});

export type AppRouter = typeof appRouter;
