import { Link } from "@tanstack/react-router";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Radio,
  Newspaper,
  Wallet,
  Zap,
  ShieldAlert,
  Settings,
  Beaker,
} from "lucide-react";
import { Logo } from "./Logo";
import { useMarketSnapshot } from "@/hooks/use-market-snapshot";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/signals", label: "Signals", icon: Radio },
  { to: "/app/feed", label: "Market Feed", icon: Newspaper },
  { to: "/app/portfolio", label: "Portfolio", icon: Wallet },
  { to: "/app/execution", label: "Execution", icon: Zap },
  { to: "/app/risk", label: "Risk Sentinel", icon: ShieldAlert },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function AnimatedCount() {
  const target = 12000 + Math.floor(Math.random() * 3000);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    const controls = animate(count, target, { duration: 2.5, ease: "easeOut" });
    return controls.stop;
  }, [count, target]);

  return <motion.span>{rounded}</motion.span>;
}

export function Sidebar() {
  const { snapshot } = useMarketSnapshot();
  const allFallback = snapshot?.sourceStack
    ? snapshot.sourceStack.every(s => !s.note.toLowerCase().includes("live"))
    : true;

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-surface/40 backdrop-blur-md">
      <div className="px-5 py-5 border-b border-border">
        <Link to="/">
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: !!item.exact }}
            className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-primary/10 data-[status=active]:text-primary data-[status=active]:font-medium"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="m-3 rounded-lg border border-border bg-surface-elevated/60 p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
          AI Monitoring Active
        </div>
        <div className="font-mono text-xs text-foreground/80">
          <AnimatedCount /> events / 24h
        </div>
        {allFallback && (
          <div className="flex items-center gap-1.5 pt-1 border-t border-border/40 text-[10px] text-warning/80">
            <Beaker className="h-3 w-3" />
            <span>Demo Mode</span>
          </div>
        )}
      </div>
    </aside>
  );
}
