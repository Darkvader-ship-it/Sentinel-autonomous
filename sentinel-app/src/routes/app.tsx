import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Sidebar } from "@/components/sentinel/Sidebar";
import { Topbar } from "@/components/sentinel/Topbar";
import { IntelligencePanel } from "@/components/sentinel/IntelligencePanel";
import { RobotAssistant } from "@/components/sentinel/RobotAssistant";
import { useAuth } from "@/lib/auth.tsx";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Sentinel Terminal" },
      {
        name: "description",
        content: "Live AI-curated market intelligence and one-click execution.",
      },
    ],
  }),
  component: AppShell,
});

function AppShell() {
  const { user, isLoading, isReady, signUp, signIn, signOut, connectWallet } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isOnboardingRoute = location.pathname.startsWith("/app/onboarding");
  const onboardingComplete = user?.onboardingComplete ?? false;

  useEffect(() => {
    if (!isReady) return;
    if (!user) return;
    if (!onboardingComplete && !isOnboardingRoute) {
      navigate({ to: "/app/onboarding", replace: true });
    }
    if (onboardingComplete && isOnboardingRoute) {
      navigate({ to: "/app", replace: true });
    }
  }, [isReady, user, isOnboardingRoute, navigate, onboardingComplete]);

  if (!isReady) {
    return <AuthStatus message="Preparing secure session…" />;
  }

  if (!user && !isLoading) {
    return <AuthForm onSignUp={signUp} onSignIn={signIn} onConnectWallet={connectWallet} />;
  }

  if (isOnboardingRoute) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar wallet={user?.wallet} email={user?.email} onSignOut={signOut} />
        <div className="flex min-h-0 flex-1">
          <main className="flex-1 min-w-0 overflow-y-auto">
            <Outlet />
          </main>
          <IntelligencePanel />
        </div>
      </div>
      <RobotAssistant />
    </div>
  );
}

function AuthStatus({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-elevated">
        <div className="font-display text-2xl font-bold tracking-tight">Sentinel</div>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function AuthForm({
  onSignUp,
  onSignIn,
  onConnectWallet,
}: {
  onSignUp: (e?: React.MouseEvent) => Promise<void>;
  onSignIn: (e?: React.MouseEvent) => Promise<void>;
  onConnectWallet: (e?: React.MouseEvent) => Promise<void>;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-elevated space-y-6">
        <div className="font-display text-2xl font-bold tracking-tight">Sentinel</div>
        <p className="text-sm text-muted-foreground">Sign in to unlock Sentinel</p>

        <button
          onClick={onSignIn}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Sign In / Sign Up
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <button
          onClick={onConnectWallet}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition"
        >
          <Wallet className="h-4 w-4" />
          <span>Connect with wallet</span>
        </button>
      </div>
    </div>
  );
}
