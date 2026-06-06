import type { MarketContext, StructuredSignal } from "@/lib/sentinel-types";

export interface StrategyRule {
  field: "price" | "ratio" | "volume" | "change" | "risk" | "signal";
  symbol?: string;
  pair?: string;
  operator: ">" | "<" | ">=" | "<=" | "==" | "crosses_above" | "crosses_below";
  value: number;
}

export interface StrategyCondition {
  rules: StrategyRule[];
  logic: "AND" | "OR";
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  naturalLanguage: string;
  condition: StrategyCondition;
  action: {
    type: "alert" | "execute" | "notify";
    target?: string;
    params?: Record<string, unknown>;
  };
  enabled: boolean;
  createdAt: string;
  lastTriggered?: string;
}

interface ParsedIntent {
  name: string;
  description: string;
  condition: StrategyCondition;
  action: Strategy["action"];
}

function extractNumber(text: string): number | null {
  const match = text.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

function extractSymbol(text: string): string | null {
  const symbols = ["BTC", "ETH", "SOL", "FET", "ONDO", "JUP", "ARB", "USDC", "DXY"];
  for (const s of symbols) {
    if (text.includes(s)) return s;
  }
  if (text.includes("bitcoin") || text.includes("btc")) return "BTC";
  if (text.includes("ethereum") || text.includes("eth")) return "ETH";
  if (text.includes("solana") || text.includes("sol")) return "SOL";
  return null;
}

function extractPair(text: string): string | null {
  const match = text.match(/([A-Z]{2,10})\s*\/\s*([A-Z]{2,10})/i);
  if (match) return `${match[1].toUpperCase()}/${match[2].toUpperCase()}`;

  const pairs = ["ETH/BTC", "SOL/BTC", "BTC/USD", "ETH/USD", "SOL/USD"];
  for (const p of pairs) {
    const [a, b] = p.split("/");
    if (
      text.toLowerCase().includes(a.toLowerCase()) &&
      text.toLowerCase().includes(b.toLowerCase())
    ) {
      return p;
    }
  }
  return null;
}

function extractAction(text: string): Strategy["action"] {
  const lower = text.toLowerCase();
  if (
    lower.includes("alert") ||
    lower.includes("notify") ||
    lower.includes("tell") ||
    lower.includes("message")
  ) {
    return { type: "alert" };
  }
  if (
    lower.includes("buy") ||
    lower.includes("sell") ||
    lower.includes("execute") ||
    lower.includes("swap")
  ) {
    const sym = extractSymbol(text);
    return {
      type: "execute",
      target: sym ?? "ETH",
      params: { side: lower.includes("buy") ? "buy" : "sell" },
    };
  }
  if (lower.includes("telegram")) {
    return { type: "notify", target: "telegram" };
  }
  return { type: "alert" };
}

function extractThreshold(text: string, defaultSymbol: string): StrategyRule[] {
  const rules: StrategyRule[] = [];
  const lower = text.toLowerCase();

  const pair = extractPair(text);
  const symbol = extractSymbol(text) ?? defaultSymbol;
  const num = extractNumber(text);

  if (!num) {
    const severityMap: Record<string, { value: number; operator: ">" | "<" }> = {
      high: { value: 70, operator: ">" },
      critical: { value: 85, operator: ">" },
      medium: { value: 40, operator: ">" },
      low: { value: 30, operator: "<" },
    };
    for (const [word, spec] of Object.entries(severityMap)) {
      if (lower.includes(word)) {
        rules.push({ field: "risk", operator: spec.operator, value: spec.value });
      }
    }
  }

  if (pair && num) {
    const [base, quote] = pair.split("/");
    rules.push({ field: "ratio", pair, operator: extractOperator(text, num), value: num });
    rules.push({ field: "price", symbol: base, operator: extractOperator(text, num), value: num });
  } else if (symbol && num) {
    if (lower.includes("volume") || lower.includes("vol")) {
      rules.push({ field: "volume", symbol, operator: extractOperator(text, num), value: num });
    } else if (lower.includes("change") || lower.includes("%") || lower.includes("percent")) {
      rules.push({ field: "change", symbol, operator: extractOperator(text, num), value: num });
    } else {
      rules.push({ field: "price", symbol, operator: extractOperator(text, num), value: num });
    }
  }

  if (rules.length === 0) {
    rules.push({ field: "risk", operator: ">", value: 70 });
  }

  return rules;
}

function extractOperator(text: string, _num: number): StrategyRule["operator"] {
  const lower = text.toLowerCase();
  if (
    lower.includes("crosses above") ||
    lower.includes("cross above") ||
    lower.includes("breaks above") ||
    lower.includes("goes above")
  )
    return "crosses_above";
  if (
    lower.includes("crosses below") ||
    lower.includes("cross below") ||
    lower.includes("breaks below") ||
    lower.includes("drops below") ||
    lower.includes("falls below")
  )
    return "crosses_below";
  if (lower.includes(">=") || lower.includes("at least") || lower.includes("minimum")) return ">=";
  if (lower.includes("<=") || lower.includes("at most") || lower.includes("maximum")) return "<=";
  if (
    lower.includes(">") ||
    lower.includes("above") ||
    lower.includes("higher") ||
    lower.includes("exceeds") ||
    lower.includes("greater")
  )
    return ">";
  if (
    lower.includes("<") ||
    lower.includes("below") ||
    lower.includes("lower") ||
    lower.includes("under") ||
    lower.includes("less")
  )
    return "<";
  return ">";
}

function extractLogic(text: string): "AND" | "OR" {
  const lower = text.toLowerCase();
  if (lower.includes(" or ") || lower.includes("either")) return "OR";
  return "AND";
}

function generateName(text: string): string {
  const words = text.split(" ").slice(0, 6);
  const name = words.join(" ");
  return name.length > 40 ? name.slice(0, 40) + "…" : name;
}

function generateDescription(text: string): string {
  return text.length > 100 ? text.slice(0, 100) + "…" : text;
}

export function parseNaturalLanguage(input: string, defaultSymbol = "BTC"): ParsedIntent {
  const rules = extractThreshold(input, defaultSymbol);
  const logic = extractLogic(input);

  return {
    name: generateName(input),
    description: generateDescription(input),
    condition: { rules, logic },
    action: extractAction(input),
  };
}

export function evaluateStrategy(
  strategy: Strategy,
  context: MarketContext,
  signals: StructuredSignal[],
): boolean {
  const results = strategy.condition.rules.map((rule) => evaluateRule(rule, context, signals));
  return strategy.condition.logic === "AND" ? results.every(Boolean) : results.some(Boolean);
}

function evaluateRule(
  rule: StrategyRule,
  context: MarketContext,
  _signals: StructuredSignal[],
): boolean {
  const actual = getActualValue(rule, context, _signals);
  if (actual === null) return false;

  const operator = rule.operator;
  if (operator === "crosses_above" || operator === "crosses_below") {
    return simulateCrossing(actual, rule.value, operator === "crosses_above");
  }

  switch (operator) {
    case ">":
      return actual > rule.value;
    case "<":
      return actual < rule.value;
    case ">=":
      return actual >= rule.value;
    case "<=":
      return actual <= rule.value;
    case "==":
      return Math.abs(actual - rule.value) < 0.001;
  }
}

function getActualValue(
  rule: StrategyRule,
  context: MarketContext,
  signals?: StructuredSignal[],
): number | null {
  switch (rule.field) {
    case "price": {
      const p = context.prices.find((p) => p.symbol === rule.symbol);
      return p?.price ?? null;
    }
    case "ratio": {
      if (!rule.pair) return null;
      const [base, quote] = rule.pair.split("/");
      const bp = context.prices.find((p) => p.symbol === base)?.price;
      const qp = context.prices.find((p) => p.symbol === quote)?.price;
      if (bp && qp) return bp / qp;
      return null;
    }
    case "change": {
      const p = context.prices.find((p) => p.symbol === rule.symbol);
      return p?.change24h ?? null;
    }
    case "volume": {
      return null;
    }
    case "risk": {
      return null;
    }
    case "signal": {
      return signals?.length ?? 0;
    }
  }
}

function simulateCrossing(_actual: number, _target: number, _above: boolean): boolean {
  return false;
}

let strategyCounter = 0;
const storedStrategies: Strategy[] = [];

export function listStrategies(): Strategy[] {
  return storedStrategies;
}

export function addStrategy(input: string, defaultSymbol = "BTC"): Strategy {
  const parsed = parseNaturalLanguage(input, defaultSymbol);
  const id = `strat-${++strategyCounter}-${Date.now().toString(36)}`;
  const strategy: Strategy = {
    id,
    name: parsed.name,
    description: parsed.description,
    naturalLanguage: input,
    condition: parsed.condition,
    action: parsed.action,
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  storedStrategies.push(strategy);
  return strategy;
}

export function removeStrategy(id: string): void {
  const idx = storedStrategies.findIndex((s) => s.id === id);
  if (idx >= 0) storedStrategies.splice(idx, 1);
}

export function toggleStrategy(id: string): Strategy | null {
  const s = storedStrategies.find((s) => s.id === id);
  if (s) s.enabled = !s.enabled;
  return s ?? null;
}
