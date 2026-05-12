import { Activity } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  const icon = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="absolute inset-0 rounded-md bg-primary/30 blur-md" />
        <div className="relative rounded-md bg-gradient-to-br from-primary to-accent p-1.5">
          <Activity className={`${icon} text-primary-foreground`} strokeWidth={2.5} />
        </div>
      </div>
      <span className={`font-display font-bold tracking-tight ${text}`}>SENTINEL</span>
    </div>
  );
}
