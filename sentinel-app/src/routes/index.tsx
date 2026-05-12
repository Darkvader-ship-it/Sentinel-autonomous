import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, Brain, Zap, ShieldAlert, ArrowRight, TrendingUp } from "lucide-react";
import { Logo } from "@/components/sentinel/Logo";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sentinel — Autonomous Market Intelligence for On-Chain Traders" },
      {
        name: "description",
        content:
          "Sentinel monitors ETF flows, macro events, token unlocks, and liquidity shifts — then explains what matters and helps you act instantly through SoDEX.",
      },
      { property: "og:title", content: "Sentinel — Autonomous Market Intelligence" },
      {
        property: "og:description",
        content:
          "AI that watches markets, explains what matters, and helps you execute. Built for serious on-chain traders.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero background */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroBg}
          alt=""
          className="h-full w-full object-cover opacity-40"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="absolute inset-0 grid-bg opacity-30" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">
            Features
          </a>
          <a href="#how" className="hover:text-foreground transition">
            How it works
          </a>
          <a href="#preview" className="hover:text-foreground transition">
            Preview
          </a>
        </nav>
        <Link
          to="/app"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition glow-primary"
        >
          Launch Sentinel
        </Link>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-mono uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
            Live · 12,847 events analyzed today
          </div>

          <h1 className="mt-6 font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Autonomous Market Intelligence{" "}
            <span className="text-gradient">for On-Chain Traders</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
            Sentinel monitors ETF flows, macro events, token unlocks, and liquidity shifts — then
            explains what matters and helps you act instantly through SoDEX.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app"
              className="group inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition glow-primary"
            >
              Launch Sentinel
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#preview"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface/60 backdrop-blur px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary transition"
            >
              See live preview
            </a>
          </div>
        </motion.div>

        {/* UI preview mock */}
        <motion.div
          id="preview"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative mx-auto mt-20 max-w-5xl"
        >
          <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-3xl" />
          <div className="relative rounded-2xl border border-border glass-strong shadow-elevated overflow-hidden">
            <div className="flex items-center gap-1.5 border-b border-border/60 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              <span className="ml-3 font-mono text-[10px] text-muted-foreground">
                sentinel.app/dashboard
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
              <PreviewCard
                tag="MARKET EVENT"
                title="BTC ETF Outflows Spike 14%"
                line="Institutional risk weakening. Short-term downside increasing."
                impact="HIGH"
                impactClass="text-destructive border-destructive/40 bg-destructive/10"
              />
              <PreviewCard
                tag="LIQUIDITY"
                title="Stablecoins → Solana +$240M"
                line="AI sector rotation pattern matches prior pre-rally setups."
                impact="MED"
                impactClass="text-warning border-warning/40 bg-warning/10"
              />
              <PreviewCard
                tag="ON-CHAIN"
                title="Whale Accumulation +$182M ETH"
                line="Smart money increasing exposure during recent dip."
                impact="HIGH"
                impactClass="text-primary border-primary/40 bg-primary/10"
              />
            </div>
          </div>
        </motion.div>
      </section>

      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-3">
            What it does
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Three layers of edge
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Feature
            icon={Activity}
            title="Market Sentinel"
            desc="Tracks ETF flows, macro news, volatility regimes, and liquidity shifts across centralized and on-chain venues."
            tags={["ETF flows", "Macro", "Liquidity", "Volatility"]}
          />
          <Feature
            icon={Brain}
            title="Analysis Engine"
            desc="Explains why markets moved, what changed, and what matters for your portfolio — not generic ChatGPT."
            tags={["Causal", "Contextual", "Confidence-scored"]}
          />
          <Feature
            icon={Zap}
            title="Execution Layer"
            desc="One-click rotate, hedge, and execute strategies through SoDEX — institutional-grade routing."
            tags={["SoDEX", "1-click", "Self-custody"]}
          />
        </div>
      </section>

      <section
        id="how"
        className="relative z-10 mx-auto max-w-7xl px-6 py-24 border-t border-border"
      >
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-3">
              The principle
            </div>
            <h2 className="font-display text-4xl font-bold tracking-tight leading-tight">
              Don't analyze markets. Be told what to do.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Sentinel continuously answers four questions: what happened, why it matters, what you
              should do, and whether you can execute now. That's the entire product.
            </p>
            <Link
              to="/app"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition glow-primary"
            >
              Open the Terminal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3">
            {[
              { q: "What happened?", a: "BTC ETFs saw $312M outflows over 48h." },
              {
                q: "Why does it matter?",
                a: "Institutional risk-off historically pulls majors -3 to -6% within 72h.",
              },
              {
                q: "What should I do?",
                a: "Reduce leverage 15%, rotate idle USDC into ETH on weakness.",
              },
              {
                q: "Can I execute now?",
                a: "Yes — one click routes through SoDEX with optimal slippage.",
              },
            ].map((row) => (
              <div
                key={row.q}
                className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition"
              >
                <div className="font-mono text-[10px] uppercase tracking-wider text-primary">
                  {row.q}
                </div>
                <div className="mt-1 text-sm text-foreground/90">{row.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border mt-12">
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <Logo size="sm" />
          <div>© 2026 Sentinel — Autonomous Market Intelligence</div>
        </div>
      </footer>
    </div>
  );
}

function PreviewCard({
  tag,
  title,
  line,
  impact,
  impactClass,
}: {
  tag: string;
  title: string;
  line: string;
  impact: string;
  impactClass: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          {tag}
        </span>
        <span
          className={`rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-semibold ${impactClass}`}
        >
          {impact}
        </span>
      </div>
      <div className="mt-2 text-sm font-semibold text-foreground">{title}</div>
      <div className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{line}</div>
      <div className="mt-3 flex items-center gap-1 text-[10px] text-primary">
        <Zap className="h-3 w-3" /> Execute
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
  tags,
}: {
  icon: any;
  title: string;
  desc: string;
  tags: string[];
}) {
  return (
    <div className="group relative rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition" />
      <div className="relative">
        <div className="inline-flex rounded-lg bg-primary/10 p-2.5 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-surface/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
