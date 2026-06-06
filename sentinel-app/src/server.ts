import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  analyzeMarket,
  getMarketSnapshot,
  refreshMarketSnapshot,
  submitExecution,
  type RiskProfile,
} from "./lib/intelligence-engine";
import { createSentinelStore } from "./lib/sentinel-store";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  if (request.method === "GET" || request.method === "HEAD") {
    return {};
  }

  const text = await request.text();
  if (!text.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
  );
  return items.length ? items : undefined;
}

async function handleApiRoute(request: Request, url: URL, env: unknown): Promise<Response> {
  const store = createSentinelStore(env);

  if (url.pathname === "/app/api/market" && request.method === "GET") {
    const forceRefresh = url.searchParams.get("refresh") === "1";
    return Response.json(await getMarketSnapshot({ forceRefresh, env }));
  }

  if (url.pathname === "/app/api/analyze" && request.method === "POST") {
    const body = await readJsonBody(request);
    const riskProfile =
      body.riskProfile === "Conservative" ||
      body.riskProfile === "Moderate" ||
      body.riskProfile === "Aggressive"
        ? (body.riskProfile as RiskProfile)
        : undefined;

    return Response.json(
      await analyzeMarket({
        env,
        riskProfile,
        signals: Array.isArray(body.signals) ? (body.signals as never) : undefined,
      }),
    );
  }

  if (url.pathname === "/app/api/execute" && request.method === "POST") {
    const body = await readJsonBody(request);
    const from = typeof body.from === "string" && body.from.trim() ? body.from : "USDC";
    const to = typeof body.to === "string" && body.to.trim() ? body.to : "ETH";
    const sizeUsd =
      typeof body.sizeUsd === "number" && Number.isFinite(body.sizeUsd) ? body.sizeUsd : 5_000;
    const route = typeof body.route === "string" && body.route.trim() ? body.route : undefined;
    const slippageBps =
      typeof body.slippageBps === "number" && Number.isFinite(body.slippageBps)
        ? body.slippageBps
        : undefined;
    const riskProfile =
      body.riskProfile === "Conservative" ||
      body.riskProfile === "Moderate" ||
      body.riskProfile === "Aggressive"
        ? (body.riskProfile as RiskProfile)
        : undefined;

    const execution = await submitExecution({
      from,
      to,
      sizeUsd,
      route,
      slippageBps,
      riskProfile,
    });

    await store.addExecution({
      id: execution.transactionId,
      status: "submitted",
      from,
      to,
      sizeUsd,
      route: execution.route,
      slippageBps: execution.slippageBps,
      estimatedFeesUsd: execution.estimatedFeesUsd,
      createdAt: new Date().toISOString(),
    });

    return Response.json(execution);
  }

  if (url.pathname === "/app/api/profile") {
    if (request.method === "GET") {
      return Response.json(await store.getProfile());
    }

    if (request.method === "POST") {
      const body = await readJsonBody(request);
      const current = await store.getProfile();
      const profile = {
        wallet:
          typeof body.wallet === "string" && body.wallet.trim() ? body.wallet : current.wallet,
        riskProfile:
          body.riskProfile === "Conservative" ||
          body.riskProfile === "Moderate" ||
          body.riskProfile === "Aggressive"
            ? (body.riskProfile as RiskProfile)
            : current.riskProfile,
        interests: readStringArray(body.interests) ?? current.interests,
        monitoring:
          body.monitoring === "Enabled" || body.monitoring === "Paused" || body.monitoring === "Off"
            ? (body.monitoring as "Enabled" | "Paused" | "Off")
            : current.monitoring,
        notifications:
          typeof body.notifications === "string" && body.notifications.trim()
            ? body.notifications
            : current.notifications,
        onboardingComplete:
          typeof body.onboardingComplete === "boolean"
            ? body.onboardingComplete
            : current.onboardingComplete,
      };

      await store.setProfile(profile);
      return Response.json(profile);
    }
  }

  if (url.pathname === "/app/api/refresh" && request.method === "POST") {
    return Response.json(await refreshMarketSnapshot(env, { forceRefresh: true }));
  }

  if (url.pathname === "/app/api/cron/refresh" && request.method === "POST") {
    return Response.json(await refreshMarketSnapshot(env, { forceRefresh: true }));
  }

  if (url.pathname === "/app/api/alerts" && request.method === "GET") {
    return Response.json(await store.listAlerts());
  }

  if (url.pathname === "/app/api/strategy/parse" && request.method === "POST") {
    const body = await readJsonBody(request);
    const { parseNaturalLanguage, addStrategy } = await import("@/lib/strategy-engine");
    const input = typeof body.input === "string" ? body.input : "";
    if (!input.trim()) {
      return Response.json({ error: "No input provided" }, { status: 400 });
    }
    const strategy = addStrategy(input);
    return Response.json(strategy);
  }

  if (url.pathname === "/app/api/strategy/evaluate" && request.method === "POST") {
    const body = await readJsonBody(request);
    const { evaluateStrategy } = await import("@/lib/strategy-engine");
    const snapshot = await getMarketSnapshot({ env });
    const strategy = body.strategy as any;
    if (!strategy?.condition) {
      return Response.json({ error: "Invalid strategy" }, { status: 400 });
    }
    const triggered = evaluateStrategy(strategy, snapshot as any, snapshot.signals ?? []);
    return Response.json({ triggered });
  }

  if (url.pathname === "/app/api/telegram/send" && request.method === "POST") {
    const body = await readJsonBody(request);
    const { sendTelegramAlert } = await import("@/lib/telegram");
    const message = typeof body.message === "string" ? body.message : "";
    if (!message.trim()) {
      return Response.json({ error: "No message provided" }, { status: 400 });
    }
    const sent = await sendTelegramAlert(message);
    return Response.json({ sent });
  }

  if (url.pathname === "/app/api/debug/sosovalue" && request.method === "GET") {
    const { ingestMarketContext } = await import("@/lib/market-ingestion");
    try {
      const context = await ingestMarketContext(env, { forceRefresh: true });
      const soSoSource = context.sourceStack.find((s) => s.name === "SoSoValue");
      return Response.json({
        live: soSoSource?.note.includes("Live") ?? false,
        note: soSoSource?.note ?? "not found",
        endpoints: context.sourceStack.map((s) => ({ name: s.name, note: s.note })),
        etfOutflowPct: context.etfOutflowPct,
        narrative: context.narrative.slice(0, 100),
        fetchedAt: context.fetchedAt,
      });
    } catch (e) {
      return Response.json({ error: String(e) }, { status: 500 });
    }
  }

  if (url.pathname === "/app/api/debug/env" && request.method === "GET") {
    return Response.json({
      hasSosovalueKey: typeof (env as Record<string, unknown>).SOSOVALUE_API_KEY === "string" && !!(env as Record<string, unknown>).SOSOVALUE_API_KEY,
      keyLength: ((env as Record<string, unknown>).SOSOVALUE_API_KEY as string)?.length ?? 0,
      hasSosovalueUrl: typeof (env as Record<string, unknown>).SOSOVALUE_API_URL === "string",
      source: typeof process !== "undefined" && process.env ? "process.env" : "env-param",
      nodeEnv: typeof process !== "undefined" && process.env ? (process.env.NODE_ENV ?? "not set") : "unknown",
    });
  }

  if (url.pathname === "/app/api/sentiment" && request.method === "GET") {
    const { fetchSocialSentiment } = await import("@/lib/social-sentiment");
    const snapshot = await getMarketSnapshot({ env });
    const sentiment = fetchSocialSentiment(
      snapshot.tickers.map((t: { symbol: string; price: number; change: number }) => ({
        symbol: t.symbol,
        price: t.price,
        change24h: t.change,
      })),
    );
    return Response.json(sentiment);
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export { handleApiRoute };

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const env = process.env ?? {};

  if (url.pathname.startsWith("/app/api/")) {
    return handleApiRoute(request, url, env);
  }

  try {
    const handler = await getServerEntry();
    const response = await handler.fetch(request, env, {});
    return await normalizeCatastrophicSsrResponse(response);
  } catch (error) {
    console.error(error);
    return brandedErrorResponse();
  }
}

export default {
  async fetch(request: Request, env: unknown, _ctx: unknown) {
    return handleRequest(request);
  },
};
