import type { MarketContext } from "@/lib/sentinel-types";
import type { Strategy } from "@/lib/strategy-engine";

export interface BacktestDay {
  day: string;
  triggered: boolean;
  price: number;
  change24h: number;
}

export interface BacktestResult {
  strategyName: string;
  totalDays: number;
  triggerDays: number;
  triggerRate: number;
  days: BacktestDay[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function runBacktest(strategy: Strategy, context: MarketContext): BacktestResult {
  const basePrice =
    context.prices.find((p) => {
      const symbol = strategy.condition.rules.find((r) => r.symbol)?.symbol;
      return p.symbol === symbol;
    })?.price ?? 100;

  const days: BacktestDay[] = [];
  let triggerCount = 0;

  for (let i = 6; i >= 0; i--) {
    const dayIndex = (((new Date().getDay() - i) % 7) + 7) % 7;
    const volatility = basePrice * 0.03;
    const price = basePrice + (Math.random() - 0.5) * volatility * (i + 1);
    const change24h = ((price - basePrice) / basePrice) * 100;

    const dayContext: MarketContext = {
      ...context,
      prices: context.prices.map((p) => {
        const sym = strategy.condition.rules.find((r) => r.symbol)?.symbol;
        return {
          ...p,
          price: p.symbol === sym ? price : p.price,
          change24h: p.symbol === sym ? change24h : p.change24h,
        };
      }),
    };

    const triggered = strategy.condition.rules.some((rule) => {
      const actual = dayContext.prices.find((p) => p.symbol === rule.symbol)?.price;
      if (!actual) return false;
      switch (rule.operator) {
        case ">":
          return actual > rule.value;
        case "<":
          return actual < rule.value;
        case ">=":
          return actual >= rule.value;
        case "<=":
          return actual <= rule.value;
        default:
          return false;
      }
    });

    if (triggered) triggerCount++;
    days.push({
      day: DAYS[dayIndex],
      triggered,
      price: Math.round(price * 100) / 100,
      change24h: Math.round(change24h * 100) / 100,
    });
  }

  return {
    strategyName: strategy.name,
    totalDays: days.length,
    triggerDays: triggerCount,
    triggerRate: Math.round((triggerCount / days.length) * 100),
    days,
  };
}
