import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Shield, Wallet } from "lucide-react";
import { useMarketSnapshot } from "@/hooks/use-market-snapshot";
import { useAuth } from "@/lib/auth";

type SettingKey = "risk" | "interests" | "monitoring" | "notifications" | "wallet";

const OPTIONS: Record<SettingKey, { label: string; choices: string[] }> = {
  risk: { label: "Risk Profile", choices: ["Conservative", "Moderate", "Aggressive"] },
  interests: {
    label: "Interests",
    choices: ["BTC", "ETH", "SOL", "AI", "DeFi", "Memecoins", "RWA", "L2s"],
  },
  monitoring: { label: "Real-time AI Monitoring", choices: ["Enabled", "Paused", "Off"] },
  notifications: {
    label: "Notification Channel",
    choices: ["In-app", "In-app + Email", "In-app + Push", "All channels"],
  },
  wallet: { label: "Connected Wallet", choices: ["0x4a...e8f2", "0x91...a13c", "Disconnected"] },
};

const MULTI: Record<SettingKey, boolean> = {
  risk: false,
  interests: true,
  monitoring: false,
  notifications: false,
  wallet: false,
};

export const Route = createFileRoute("/app/onboarding")({
  component: OnboardingRoute,
});

function OnboardingRoute() {
  const { snapshot } = useMarketSnapshot();
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const profile = snapshot?.profile;

  const initialValues = useMemo(
    () => ({
      risk: [profile?.riskProfile ?? "Moderate"],
      interests: profile?.interests ?? ["BTC", "ETH", "AI", "DeFi", "SOL"],
      monitoring: [profile?.monitoring ?? "Enabled"],
      notifications: [profile?.notifications ?? "In-app + Email"],
      wallet: [profile?.wallet ?? "0x4a...e8f2"],
    }),
    [profile],
  );

  const [values, setValues] = useState<Record<SettingKey, string[]>>(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const toggle = (key: SettingKey, choice: string) => {
    setValues((prev) => {
      const current = prev[key];
      if (MULTI[key]) {
        return {
          ...prev,
          [key]: current.includes(choice)
            ? current.filter((c) => c !== choice)
            : [...current, choice],
        };
      }
      return { ...prev, [key]: [choice] };
    });
  };

  const completeOnboarding = async () => {
    const selectedWallet = values.wallet[0];
    await fetch("/app/api/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        riskProfile: values.risk[0],
        interests: values.interests,
        monitoring: values.monitoring[0],
        notifications: values.notifications[0],
        wallet: selectedWallet,
        onboardingComplete: true,
      }),
    });
    updateUser({ onboardingComplete: true });
    navigate({ to: "/app", replace: true });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-card/80 p-6 shadow-elevated backdrop-blur">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary">
          <Shield className="h-3.5 w-3.5" /> First-run setup
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
          Set your operating profile
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Tell Sentinel what you care about, how much risk to tolerate, and where to send alerts
          before the terminal starts routing decisions.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(Object.keys(OPTIONS) as SettingKey[]).map((key) => {
            const { label, choices } = OPTIONS[key];
            const selected = values[key];
            return (
              <div key={key} className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-medium text-foreground">{label}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {MULTI[key] ? "Select multiple" : "Select one"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {choices.map((choice) => {
                    const active = selected.includes(choice);
                    return (
                      <button
                        key={choice}
                        onClick={() => toggle(key, choice)}
                        className={[
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground",
                        ].join(" ")}
                      >
                        {active ? (
                          <Check className="h-3 w-3" />
                        ) : key === "wallet" ? (
                          <Wallet className="h-3 w-3" />
                        ) : null}
                        {choice}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-4">
          <div className="text-xs text-muted-foreground">
            This profile drives your risk score, alert priority, and recommendation tuning.
          </div>
          <button
            onClick={completeOnboarding}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Enter Sentinel
          </button>
        </div>
      </div>
    </div>
  );
}
