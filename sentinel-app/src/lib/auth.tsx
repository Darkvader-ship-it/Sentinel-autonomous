import { createContext, useContext, useMemo, useCallback, useState, useEffect } from "react";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import { base } from "viem/chains";

interface User {
  id: string;
  email: string;
  wallet: string | null;
  name: string | null;
  onboardingComplete: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isReady: boolean;
  signUp: (e?: React.MouseEvent) => Promise<void>;
  signIn: (e?: React.MouseEvent) => Promise<void>;
  connectWallet: (e?: React.MouseEvent) => Promise<void>;
  unlinkWallet: (address: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const noop = async () => {};

const SSR_CONTEXT: AuthContextType = {
  user: null,
  isLoading: true,
  isReady: false,
  signUp: noop,
  signIn: noop,
  connectWallet: noop,
  unlinkWallet: noop,
  signOut: noop,
  updateUser: () => {},
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function getOnboardingComplete(): boolean {
  return localStorage.getItem("sentinel_onboarding") === "true";
}

function setOnboardingComplete(value: boolean) {
  if (value) {
    localStorage.setItem("sentinel_onboarding", "true");
  } else {
    localStorage.removeItem("sentinel_onboarding");
  }
}

const PRIVY_CONFIG = {
  loginMethods: ["email", "wallet", "google"] as ("email" | "wallet" | "google")[],
  appearance: { theme: "dark" as const, accentColor: "#676FFF" as `#${string}` },
  defaultChain: base,
  supportedChains: [base],
  embeddedWallets: {
    ethereum: { createOnLogin: "all-users" as const },
    solana: { createOnLogin: "all-users" as const },
  },
};

function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  const { user: privyUser, ready, authenticated, login, logout, linkWallet, unlinkWallet: privyUnlinkWallet } = usePrivy();
  const [tick, setTick] = useState(0);

  const user: User | null = useMemo(() => {
    if (!privyUser || !authenticated) return null;
    return {
      id: privyUser.id,
      email: privyUser.email?.address ?? "",
      wallet: privyUser.wallet?.address ?? null,
      name: privyUser.email?.address?.split("@")[0] ?? null,
      onboardingComplete: getOnboardingComplete(),
    };
  }, [privyUser, authenticated, tick]);

  const signIn = useCallback(
    async (e?: React.MouseEvent) => {
      await login(e);
    },
    [login],
  );

  const signUp = useCallback(
    async (e?: React.MouseEvent) => {
      await login(e);
    },
    [login],
  );

  const connectWallet = useCallback(
    async (e?: React.MouseEvent) => {
      if (!authenticated) {
        await login({ loginMethods: ["wallet"] });
      } else {
        await linkWallet(e);
      }
    },
    [authenticated, login, linkWallet],
  );

  const unlinkWallet = useCallback(
    async (address: string) => {
      await privyUnlinkWallet(address);
      setTick((t) => t + 1);
    },
    [privyUnlinkWallet],
  );

  const signOut = useCallback(async () => {
    localStorage.removeItem("sentinel_onboarding");
    await logout();
  }, [logout]);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (updates.onboardingComplete !== undefined) {
      setOnboardingComplete(updates.onboardingComplete);
    }
    setTick((t) => t + 1);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading: !ready,
      isReady: ready,
      signUp,
      signIn,
      connectWallet,
      unlinkWallet,
      signOut,
      updateUser,
    }),
    [user, ready, signUp, signIn, connectWallet, unlinkWallet, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const appId = import.meta.env.VITE_PRIVY_APP_ID;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <AuthContext.Provider value={SSR_CONTEXT}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <PrivyProvider appId={appId} config={PRIVY_CONFIG}>
      <SmartWalletsProvider>
        <PrivyAuthProvider>
          {children}
        </PrivyAuthProvider>
      </SmartWalletsProvider>
    </PrivyProvider>
  );
}
