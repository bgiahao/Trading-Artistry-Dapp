import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

export default async function trpcHandler(req: VercelRequest, res: VercelResponse) {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host || "localhost";
  const url = `${protocol}://${host}${req.url || "/api/trpc"}`;
  const headerEntries: [string, string][] = Object.entries(req.headers).flatMap(([key, value]) => value == null ? [] : [[key, Array.isArray(value) ? value.join(",") : value as string]]);
  const request = new Request(url, {
    method: req.method,
    headers: new Headers(headerEntries),
    body: req.method === "GET" || req.method === "HEAD" ? undefined : JSON.stringify(req.body ?? {}),
  });
  const response = await fetchRequestHandler({ endpoint: "/api/trpc", req: request, router: appRouter, createContext: () => createContext({ req: { headers: Object.fromEntries(request.headers.entries()) } as never, res: { clearCookie: () => undefined } as never, info: {} as never }) });
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.send(await response.text());
}
