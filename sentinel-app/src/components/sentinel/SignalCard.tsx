import { useState, useEffect } from "react";
import type { FeedItem } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Zap, EyeOff, Bookmark, ArrowRight, Radio, Waves, TrendingUp, Shield, Eye, Clock } from "lucide-react";
import { ExecutionModal, type ExecutionPlan } from "./ExecutionModal";

const impactColor = {
  HIGH: "text-destructive border-destructive/40 bg-destructive/10",
  MEDIUM: "text-warning border-warning/40 bg-warning/10",
  LOW: "text-primary border-primary/40 bg-primary/10",
} as const;

const impactBg = {
  HIGH: "bg-destructive",
  MEDIUM: "bg-warning",
  LOW: "bg-primary",
} as const;

const CATEGORY_ICONS: Record<string, typeof Radio> = {
  "MARKET EVENT": TrendingUp,
  "MACRO SIGNAL": Shield,
  "LIQUIDITY SHIFT": Waves,
  "TOKEN UNLOCK": Eye,
  "ON-CHAIN": Radio,
};

function ConfidenceRing({ value, size = 36 }: { value: number; size?: number }) {
  const stroke = 2.5;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;

  const color =
    value >= 85 ? "#22c55e" :
    value >= 70 ? "#eab308" :
    "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute font-mono text-[9px] font-semibold" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

function FreshIndicator({ timeStr }: { timeStr: string }) {
  const isFresh = timeStr.includes("m") && parseInt(timeStr) <= 30;

  if (!isFresh) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-mono text-success border border-success/20">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
      </span>
      NEW
    </span>
  );
}

export function SignalCard({ item, index = 0 }: { item: FeedItem; index?: number }) {
  const [open, setOpen] = useState(false);
  const executionPlan = inferExecutionPlan(item);
  const Icon = CATEGORY_ICONS[item.category];

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
        className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-md"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground truncate">
                {item.category}
              </span>
              <FreshIndicator timeStr={item.time} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${impactColor[item.impact]}`}
              >
                {item.impact}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>

              <div className="mt-3 rounded-md border border-border/60 bg-surface/50 p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-primary/80 mb-1">
                  AI Interpretation
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{item.interpretation}</p>
              </div>

              <div className="mt-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  Suggested Action
                </div>
                <ul className="space-y-1">
                  {item.actions.map((a) => (
                    <li key={a} className="flex items-start gap-2 text-sm text-foreground/85">
                      <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
              <ConfidenceRing value={item.confidence} />
              <span className="font-mono text-[9px] text-muted-foreground">confidence</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 pt-2 border-t border-border/40">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {item.time}
            </div>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-[10px] text-muted-foreground">
              ID: {item.id.padStart(4, "0")}
            </span>
            <div className="flex-1" />
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition glow-primary"
            >
              <Zap className="h-3.5 w-3.5" />
              Execute
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition">
              <Bookmark className="h-3.5 w-3.5" />
              Save
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition">
              <EyeOff className="h-3.5 w-3.5" />
              Ignore
            </button>
          </div>
        </div>
      </motion.article>

      <ExecutionModal open={open} onOpenChange={setOpen} plan={executionPlan} />
    </>
  );
}

function inferExecutionPlan(item: FeedItem): ExecutionPlan {
  const title = item.title.toLowerCase();
  const firstAction = item.actions[0] ?? "Rebalance to reduce risk";

  if (title.includes("whale") || title.includes("eth")) {
    return {
      from: "USDC",
      to: "ETH",
      sizeUsd: 10_200,
      route: "SoDEX · direct",
      reason: firstAction,
      riskProfile: "Moderate",
    };
  }

  if (title.includes("solana") || title.includes("liquidity")) {
    return {
      from: "USDC",
      to: "SOL",
      sizeUsd: 6_400,
      route: "SoDEX · 2 hops",
      reason: firstAction,
      riskProfile: "Moderate",
    };
  }

  if (title.includes("unlock")) {
    return {
      from: "ARB",
      to: "USDC",
      sizeUsd: 5_200,
      route: "SoDEX · direct",
      reason: firstAction,
      riskProfile: "Conservative",
    };
  }

  return {
    from: "USDC",
    to: "ETH",
    sizeUsd: item.impact === "HIGH" ? 8_200 : 4_600,
    route: item.impact === "HIGH" ? "SoDEX · direct" : "SoDEX · 2 hops",
    reason: firstAction,
    riskProfile: item.impact === "HIGH" ? "Moderate" : "Aggressive",
  };
}
