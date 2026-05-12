import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useMarketSnapshot } from "@/hooks/use-market-snapshot";
import type { RiskProfile } from "@/lib/intelligence-engine";

export interface ExecutionPlan {
  from: string;
  to: string;
  sizeUsd: number;
  route?: string;
  reason: string;
  riskProfile?: RiskProfile;
  expectedOutputAmount?: number;
  expectedOutputSymbol?: string;
}

interface ExecutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ExecutionPlan | null;
}

export function ExecutionModal({ open, onOpenChange, plan }: ExecutionModalProps) {
  const { snapshot } = useMarketSnapshot();
  const [slippageTolerance, setSlippageTolerance] = useState(12);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [actualRoute, setActualRoute] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStatus("idle");
      setTransactionId(null);
      setActualRoute(null);
      setSlippageTolerance(
        plan?.riskProfile === "Conservative" ? 10 : plan?.riskProfile === "Aggressive" ? 18 : 12,
      );
    }
  }, [open, plan]);

  const outputAmount = useMemo(() => {
    if (!plan) return 0;
    if (plan.expectedOutputAmount !== undefined) return plan.expectedOutputAmount;
    
    // Use snapshot prices if available, fallback to 1 (USDC)
    const price = snapshot?.tickers.find(t => t.symbol === plan.to)?.price ?? 1;
    const fees = Number((plan.sizeUsd * 0.00055 + 0.5).toFixed(2));
    return Number(((plan.sizeUsd - fees) / price).toFixed(price < 1 ? 6 : 4));
  }, [plan, snapshot]);

  const outputSymbol = plan?.expectedOutputSymbol ?? plan?.to ?? "";

  const preview = useMemo(() => {
    if (!plan) return null;

    const route = plan.route ?? "Analyzing liquidity...";
    const estimatedFeesUsd = Number((plan.sizeUsd * 0.00055 + 0.5).toFixed(2));

    return {
      route,
      estimatedFeesUsd,
      expectedOutcome: slippageTolerance <= 10
          ? "Execution quality looks tight with low route friction."
          : "Execution is viable, but monitoring route depth is recommended.",
    };
  }, [plan, slippageTolerance]);

  const handleConfirm = async () => {
    if (!plan) return;

    try {
      setStatus("submitting");
      const response = await fetch("/app/api/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          from: plan.from,
          to: plan.to,
          sizeUsd: plan.sizeUsd,
          route: plan.route,
          riskProfile: plan.riskProfile,
          slippageBps: slippageTolerance,
        }),
      });

      if (!response.ok) throw new Error("Execution failed");

      const result = await response.json();
      setTransactionId(result.transactionId);
      setActualRoute(result.route);
      setStatus("done");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Strategy Execution</DialogTitle>
          <DialogDescription>
            Confirming this will route the trade through the best available liquidity source.
          </DialogDescription>
        </DialogHeader>

        {plan ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Strategy Narrative
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">
                {plan.from} <span className="text-muted-foreground">→</span> {plan.to}
              </div>
              <div className="mt-2 text-xs text-foreground/80 leading-relaxed italic border-l-2 border-primary/30 pl-3">
                "{plan.reason}"
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Payload (USD)
                </div>
                <div className="mt-1 font-semibold text-lg">${plan.sizeUsd.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Est. Output
                </div>
                <div className="mt-1 font-semibold text-lg">
                  {outputAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}{" "}
                  <span className="text-muted-foreground text-sm font-normal">{outputSymbol}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Slippage Tolerance
                </div>
                <div className="font-mono text-xs font-medium">{slippageTolerance} bps</div>
              </div>
              <Slider
                value={[slippageTolerance]}
                min={4}
                max={30}
                step={1}
                onValueChange={([v]) => setSlippageTolerance(v)}
              />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="text-xs">
                  <div className="text-muted-foreground">Network Fee</div>
                  <div className="mt-0.5 font-mono text-foreground">${preview?.estimatedFeesUsd.toFixed(2)}</div>
                </div>
                <div className="text-xs text-right">
                  <div className="text-muted-foreground">Status</div>
                  <div className={`mt-0.5 font-medium ${status === "done" ? "text-success" : status === "error" ? "text-destructive" : "text-primary"}`}>
                    {status === "done" ? "Broadcasted" : status === "submitting" ? "Routing..." : "Ready"}
                  </div>
                </div>
              </div>
            </div>

            {status === "done" && transactionId && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-primary">TRANSACTION SUBMITTED</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{actualRoute}</span>
                </div>
                <div className="font-mono truncate opacity-70">ID: {transactionId}</div>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter className="pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
          >
            {status === "done" ? "Close" : "Cancel"}
          </button>
          {status !== "done" && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!plan || status === "submitting"}
              className="rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-sm active:scale-95"
            >
              {status === "submitting" ? "Confirming..." : "Execute Strategy"}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
