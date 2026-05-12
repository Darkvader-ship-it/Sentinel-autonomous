import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Radio,
  Newspaper,
  Wallet,
  Zap,
  ShieldAlert,
  Settings,
} from "lucide-react";
import { Logo } from "./Logo";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/signals", label: "Signals", icon: Radio },
  { to: "/app/feed", label: "Market Feed", icon: Newspaper },
  { to: "/app/portfolio", label: "Portfolio", icon: Wallet },
  { to: "/app/execution", label: "Execution", icon: Zap },
  { to: "/app/risk", label: "Risk Sentinel", icon: ShieldAlert },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
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
      <div className="m-3 rounded-lg border border-border bg-surface-elevated/60 p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
          AI Monitoring Active
        </div>
        <div className="mt-1 font-mono text-xs text-foreground/80">12,847 events / 24h</div>
      </div>
    </aside>
  );
}
