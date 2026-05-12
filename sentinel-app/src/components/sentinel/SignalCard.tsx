import { useState } from "react";
import type { FeedItem } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Zap, EyeOff, Bookmark, ArrowRight } from "lucide-react";
import { ExecutionModal, type ExecutionPlan } from "./ExecutionModal";

const impactColor = {
  HIGH: "text-destructive border-destructive/40 bg-destructive/10",
  MEDIUM: "text-warning border-warning/40 bg-warning/10",
  LOW: "text-primary border-primary/40 bg-primary/10",
} as const;

export function SignalCard({ item, index = 0 }: { item: FeedItem; index?: number }) {
  const [open, setOpen] = useState(false);
  const executionPlan = inferExecutionPlan(item);

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
        className="group relative overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {item.category}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${impactColor[item.impact]}`}
              >
                {item.impact}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {item.confidence}% conf
              </span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-muted-foreground">{item.time}</span>
            </div>
          </div>

          <h3 className="mt-2 font-display text-lg font-semibold text-foreground">{item.title}</h3>

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

          <div className="mt-4 flex items-center gap-2">
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
