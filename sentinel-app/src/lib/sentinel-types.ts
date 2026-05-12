import {
  portfolio,
  portfolioHistory,
  tickers,
  type FeedItem,
  type RiskLevel,
  type RiskWarning,
  type Signal,
} from "@/lib/mock-data";

export type { RiskLevel };

export type RiskProfile = "Conservative" | "Moderate" | "Aggressive";

export interface StructuredSignal {
  id: string;
  type: string;
  severity: RiskLevel;
  confidence: number;
  summary: string;
  explanation: string;
  context: string[];
}

export interface MarketContext {
  fetchedAt: string;
  sourceStack: Array<{ name: string; role: "primary" | "supplemental"; note: string }>;
  narrative: string;
  etfOutflowPct: number;
  btcVolatility: number;
  liquidityChangePct: number;
  unlockPressure: number;
  macroEvents: string[];
  prices: Array<{ symbol: string; price: number; change24h: number }>;
  rotationTheme: string;
}

export interface MarketConditions {
  volatility: "LOW" | "MEDIUM" | "HIGH";
  liquidity: "DEEP" | "NORMAL" | "TIGHT";
  macroEvent: boolean;
  narrative: string;
}

export interface RiskSnapshot {
  score: number;
  level: RiskLevel;
  reasons: string[];
}

export interface AnalysisResult {
  summary: string;
  reasoning: string;
  riskLevel: RiskLevel;
  suggestedAction: string;
  confidence: number;
}

export interface RecommendationResult {
  primaryAction: string;
  defensiveActions: string[];
  opportunityActions: string[];
}

export interface ExecutionRequest {
  from: string;
  to: string;
  sizeUsd: number;
  riskProfile?: RiskProfile;
  slippageBps?: number;
  route?: string;
}

export interface ExecutionResponse {
  status: "preview" | "submitted";
  tradePath: string;
  route: string;
  slippageBps: number;
  estimatedFeesUsd: number;
  expectedOutcome: string;
  transactionId: string;
  expectedOutputAmount: number;
  expectedOutputSymbol: string;
}

export interface AlertRecord {
  id: string;
  title: string;
  severity: RiskLevel;
  body: string;
  createdAt: string;
}

export interface ExecutionRecord {
  id: string;
  status: "pending" | "submitted" | "filled";
  from: string;
  to: string;
  sizeUsd: number;
  route: string;
  slippageBps: number;
  estimatedFeesUsd: number;
  createdAt: string;
}

export interface UserProfile {
  wallet: string;
  riskProfile: RiskProfile;
  interests: string[];
  monitoring: "Enabled" | "Paused" | "Off";
  notifications: string;
  onboardingComplete: boolean;
}

export interface MarketSnapshot {
  generatedAt: string;
  sourceStack: Array<{ name: string; role: "primary" | "supplemental"; note: string }>;
  marketConditions: MarketConditions;
  risk: RiskSnapshot;
  signals: StructuredSignal[];
  feedItems: FeedItem[];
  opportunities: Signal[];
  alerts: AlertRecord[];
  portfolio: typeof portfolio;
  portfolioHistory: typeof portfolioHistory;
  tickers: typeof tickers;
  riskWarnings: RiskWarning[];
  reasoning: AnalysisResult;
  executions: ExecutionRecord[];
  profile: UserProfile;
}
