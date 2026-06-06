import type { IncomingMessage, ServerResponse } from "http";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function collectBody(req: IncomingMessage): Promise<string | undefined> {
  if (req.method === "GET" || req.method === "HEAD") return Promise.resolve(undefined);
  return new Promise<string>((resolve) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const protocol = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/", `${protocol}://${host}`);
  const body = await collectBody(req);

  const request = new Request(url.toString(), {
    method: req.method,
    headers: new Headers(req.headers as Record<string, string>),
    body,
  });

  try {
    const serverPath = resolve(__dirname, "..", "dist", "server", "server.js");
    const mod = await import(serverPath);
    const serverFetch = mod.default?.fetch ?? mod.fetch ?? mod.handleRequest;
    const response = await serverFetch(request, process.env, {});
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(await response.text());
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end("Internal Server Error");
  }
}
