import { createExpressMiddleware } from "@trpc/server/adapters/express";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

const handler = createExpressMiddleware({ router: appRouter, createContext });

export default function trpcHandler(req: VercelRequest, res: VercelResponse) {
  const originalUrl = req.url;
  req.url = (req.url || "/").replace(/^\/api\/trpc/, "") || "/";
  const result = handler(req as never, res as never, () => undefined);
  req.url = originalUrl;
  return result;
}
