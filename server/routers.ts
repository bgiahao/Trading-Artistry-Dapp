import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createTrade, createTrades, deleteTrade, listUserTrades } from "./db";

const assetTypeSchema = z.enum(["Stocks", "Crypto", "Commodities/Futures"]);
const directionSchema = z.enum(["Long", "Short"]);
const resultSchema = z.enum(["win", "loss", "breakeven"]);

const tradeInputSchema = z.object({
  symbol: z.string().trim().min(1).max(32),
  assetType: assetTypeSchema,
  direction: directionSchema,
  entryPrice: z.number().positive(),
  exitPrice: z.number().positive(),
  positionSize: z.number().positive(),
  stopLoss: z.number().positive(),
  takeProfit: z.number().positive(),
  riskTradePct: z.number().min(0).max(100),
  setup: z.string().trim().min(1).max(80),
  chartUrl: z.string().trim().max(500).optional().or(z.literal("")),
  notes: z.string().max(5000).optional(),
  openedAt: z.coerce.date(),
  closedAt: z.coerce.date(),
});

function deriveTrade(input: z.infer<typeof tradeInputSchema>, userId: number) {
  if (input.closedAt < input.openedAt) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Closed time must be after opened time" });
  }
  if (input.entryPrice === input.stopLoss) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Stop loss must be different from entry price" });
  }
  const directionIsValid = input.direction === "Long"
    ? input.stopLoss < input.entryPrice && input.takeProfit > input.entryPrice
    : input.stopLoss > input.entryPrice && input.takeProfit < input.entryPrice;
  if (!directionIsValid) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Stop loss and take profit are on the wrong side for this position" });
  }
  const stopDistance = Math.abs(input.entryPrice - input.stopLoss);
  const rewardDistance = Math.abs(input.takeProfit - input.entryPrice);
  const riskAmount = stopDistance * input.positionSize;
  const rrRatio = stopDistance > 0 ? rewardDistance / stopDistance : 0;
  const pnl = input.direction === "Long"
    ? (input.exitPrice - input.entryPrice) * input.positionSize
    : (input.entryPrice - input.exitPrice) * input.positionSize;
  const rMultiple = riskAmount > 0 ? pnl / riskAmount : 0;
  const result = rMultiple > 0.05 ? "win" : rMultiple < -0.05 ? "loss" : "breakeven";
  return {
    ...input,
    userId,
    chartUrl: input.chartUrl || null,
    notes: input.notes || null,
    riskAmount,
    rrRatio,
    pnl,
    rMultiple,
    result,
  } as const;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  trades: router({
    list: protectedProcedure.query(({ ctx }) => listUserTrades(ctx.user.id)),
    create: protectedProcedure.input(tradeInputSchema).mutation(({ ctx, input }) => createTrade(deriveTrade(input, ctx.user.id))),
    importMany: protectedProcedure.input(z.array(tradeInputSchema).max(500)).mutation(({ ctx, input }) => createTrades(input.map(row => deriveTrade(row, ctx.user.id)))),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteTrade(ctx.user.id, input.id)),
  }),
});

export type AppRouter = typeof appRouter;
