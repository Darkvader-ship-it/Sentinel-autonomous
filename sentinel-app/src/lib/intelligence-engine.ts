import {
  feedItems as seedFeedItems,
  portfolio as seedPortfolio,
  portfolioHistory as seedPortfolioHistory,
  riskWarnings as seedRiskWarnings,
  tickers as fallbackTickers,
  type FeedItem,
} from "@/lib/mock-data";
import { buildAnalysis } from "@/lib/analysis-engine";
import { ingestMarketContext } from "@/lib/market-ingestion";
import { buildRecommendations } from "@/lib/recommendation-engine";
import { buildAlertFromSignal, buildRiskWarnings, createSentinelStore } from "@/lib/sentinel-store";
import { buildStructuredSignals } from "@/lib/signals";
import { scoreRisk } from "@/lib/risk-engine";
import type {
  AnalysisResult,
  AlertRecord,
  ExecutionRecord,
  ExecutionRequest,
  ExecutionResponse,
  MarketConditions,
  MarketContext,
  MarketSnapshot,
  RiskProfile,
  RiskSnapshot,
  StructuredSignal,
  UserProfile,
} from "@/lib/sentinel-types";
import { previewExecution, submitExecution } from "@/lib/execution-engine";

export type {
  AnalysisResult,
  ExecutionRequest,
  ExecutionResponse,
  MarketConditions,
  MarketSnapshot,
  RiskProfile,
  RiskSnapshot,
  StructuredSignal,
};

function buildMarketConditions(risk: RiskSnapshot): MarketConditions {
  return {
    volatility: risk.score >= 70 ? "HIGH" : risk.score >= 45 ? "MEDIUM" : "LOW",
    liquidity: risk.score >= 75 ? "TIGHT" : risk.score >= 50 ? "NORMAL" : "DEEP",
    macroEvent: risk.score >= 60,
    narrative:
      risk.score >= 70
        ? "Risk-off regime with selective rotation into quality narratives."
        : risk.score >= 45
          ? "Balanced market with pockets of rotation and event risk."
          : "Calmer tape with improving breadth.",
  };
}

function buildDynamicOpportunities(context: MarketContext): Array<{ id: string; type: string; summary: string; explanation: string; severity: "LOW" | "MEDIUM" | "HIGH"; confidence: number }> {
  const sol = context.prices.find(p => p.symbol === "SOL");
  const fet = context.prices.find(p => p.symbol === "FET");
  const btc = context.prices.find(p => p.symbol === "BTC");
  
  const opportunities: any[] = [];
  
  if (sol && sol.change24h > 2) {
    opportunities.push({
      id: "opp-sol",
      type: "MOMENTUM",
      summary: "Solana Ecosystem Outperformance",
      explanation: "SOL is leading majors. Look for laggard rotations in JUP and PYTH.",
      severity: "MEDIUM",
      confidence: 84
    });
  }
  
  if (fet && fet.change24h > 3) {
    opportunities.push({
      id: "opp-ai",
      type: "NARRATIVE",
      summary: "AI Sector Strength",
      explanation: "FET momentum suggests capital is rotating into decentralized compute themes.",
      severity: "MEDIUM",
      confidence: 78
    });
  }
  
  if (btc && btc.change24h < -2) {
    opportunities.push({
      id: "opp-hedge",
      type: "DEFENSIVE",
      summary: "Major Support Bounce Opportunity",
      explanation: "BTC approaching oversold territory. Watch for 1h RSI reversal for a tactical long.",
      severity: "HIGH",
      confidence: 72
    });
  }
  
  // Always include a baseline if none triggered
  if (opportunities.length === 0) {
    opportunities.push({
      id: "opp-stables",
      type: "LIQUIDITY",
      summary: "Yield Optimization Window",
      explanation: "Stablecoin demand is low. Opportunity to move dry powder into yield-bearing USDY.",
      severity: "LOW",
      confidence: 90
    });
  }
  
  return opportunities;
}

function buildFeedItems(
  signals: StructuredSignal[],
  recommendations: ReturnType<typeof buildRecommendations>,
): FeedItem[] {
  const actionPool = [
    recommendations.primaryAction,
    ...recommendations.defensiveActions,
    ...recommendations.opportunityActions,
  ];

  return signals.slice(0, 5).map((signal, index) => ({
    id: signal.id,
    category: signal.type.toUpperCase(),
    title: signal.summary,
    interpretation: signal.explanation,
    impact:
      signal.severity === "HIGH" || signal.severity === "CRITICAL"
        ? "HIGH"
        : signal.severity === "MEDIUM"
          ? "MEDIUM"
          : "LOW",
    confidence: signal.confidence,
    actions: [actionPool[index % actionPool.length] ?? recommendations.primaryAction],
    time: `${Math.max(2, 2 + index * 15)}m ago`,
  }));
}

async function composeSnapshot(
  env: unknown,
  options: { forceRefresh?: boolean } = {},
): Promise<MarketSnapshot> {
  const store = createSentinelStore(env);
  const profile: UserProfile = await store.getProfile();
  const executions = await store.listExecutions();
  const storedAlerts = await store.listAlerts();
  const context: MarketContext = await ingestMarketContext(env, options);
  const signals = buildStructuredSignals(context);
  const risk = scoreRisk(context, signals);
  const marketConditions = buildMarketConditions(risk);
  const recommendations = buildRecommendations(context, signals, risk, profile.riskProfile);
  const reasoning = buildAnalysis(context, signals, risk, recommendations, profile.riskProfile);

  const generatedFeedItems = buildFeedItems(
    signals.length ? signals : buildStructuredSignals(context),
    recommendations,
  );

  return {
    generatedAt: new Date().toISOString(),
    sourceStack: context.sourceStack,
    marketConditions,
    risk,
    signals,
    feedItems: generatedFeedItems.length ? generatedFeedItems : seedFeedItems,
    opportunities: buildDynamicOpportunities(context) as any,
    alerts: storedAlerts.length ? storedAlerts : [],
    portfolio: {
      ...seedPortfolio,
      holdings: seedPortfolio.holdings.map(h => ({
        ...h,
        value: Math.round(h.value * (1 + (context.prices.find(pr => pr.symbol === h.symbol)?.change24h ?? 0) / 100)),
        change: context.prices.find(pr => pr.symbol === h.symbol)?.change24h ?? h.change,
      })),
      totalValue: Math.round(seedPortfolio.holdings.reduce((sum, h) => 
        sum + h.value * (1 + (context.prices.find(pr => pr.symbol === h.symbol)?.change24h ?? 0) / 100), 0
      )),
      pnl24h: Math.round(seedPortfolio.holdings.reduce((sum, h) => {
        const chg = context.prices.find(pr => pr.symbol === h.symbol)?.change24h ?? h.change;
        return sum + h.value * chg / 100;
      }, 0)),
    },
    portfolioHistory: seedPortfolioHistory,
    tickers: context.prices.map(p => ({ symbol: p.symbol, price: p.price, change: p.change24h })),
    riskWarnings: buildRiskWarnings(risk.score, {
      etfOutflowPct: context.etfOutflowPct,
      btcVolatility: context.btcVolatility,
      liquidityChangePct: context.liquidityChangePct,
      unlockPressure: context.unlockPressure,
      macroEvents: context.macroEvents,
    }),
    reasoning,
    executions,
    profile,
  };
}

export async function refreshMarketSnapshot(
  env: unknown,
  options: { forceRefresh?: boolean } = {},
): Promise<MarketSnapshot> {
  const store = createSentinelStore(env);
  const snapshot = await composeSnapshot(env, options);
  await store.setSnapshot(snapshot);
  return snapshot;
}

export async function getMarketSnapshot(
  options: { forceRefresh?: boolean; env?: unknown } = {},
): Promise<MarketSnapshot> {
  const store = createSentinelStore(options.env);
  if (!options.forceRefresh) {
    const cached = await store.getSnapshot();
    if (cached) return cached;
  }

  return refreshMarketSnapshot(options.env, options);
}

export async function analyzeMarket(
  input: {
    signals?: StructuredSignal[];
    portfolio?: typeof seedPortfolio;
    riskProfile?: RiskProfile;
    marketConditions?: MarketConditions;
    env?: unknown;
  } = {},
): Promise<AnalysisResult> {
  const snapshot = await getMarketSnapshot({ env: input.env });
  const signals = input.signals?.length ? input.signals : snapshot.signals;
  const riskProfile = input.riskProfile ?? snapshot.profile.riskProfile ?? "Moderate";
  const marketConditions = input.marketConditions ?? snapshot.marketConditions;

  return {
    summary: `${snapshot.reasoning.summary} ${marketConditions.narrative}`.trim(),
    reasoning:
      `${snapshot.reasoning.reasoning} ${riskProfile === "Conservative" ? "Prioritize capital preservation." : riskProfile === "Aggressive" ? "Selective risk is acceptable, but should remain event-aware." : "Keep rotations selective and tightly risk-defined."}`.trim(),
    riskLevel: snapshot.risk.level,
    suggestedAction: snapshot.reasoning.suggestedAction,
    confidence: snapshot.reasoning.confidence,
  };
}

export { previewExecution, submitExecution };
