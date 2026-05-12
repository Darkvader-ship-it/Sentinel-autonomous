import { createContext, useContext, useMemo, useCallback, useState, useEffect } from "react";
import { PrivyProvider, usePrivy, useLogin } from "@privy-io/react-auth";

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
  isGuest: boolean;
  signUp: (e?: React.MouseEvent) => Promise<void>;
  signIn: (e?: React.MouseEvent) => Promise<void>;
  connectWallet: (e?: React.MouseEvent) => Promise<void>;
  unlinkWallet: (address: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const noop = async () => {};

const GUEST_USER: User = {
  id: "guest",
  email: "guest@sentinel.demo",
  wallet: "0x4a...e8f2",
  name: "Demo Trader",
  onboardingComplete: true,
};

const SSR_CONTEXT: AuthContextType = {
  user: null,
  isLoading: true,
  isReady: false,
  isGuest: false,
  signUp: noop,
  signIn: noop,
  connectWallet: noop,
  unlinkWallet: noop,
  signOut: noop,
  updateUser: () => {},
  loginAsGuest: () => {},
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
  embeddedWallets: {
    ethereum: { createOnLogin: "all-users" as const },
    solana: { createOnLogin: "all-users" as const },
  },
};

function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  const { user: privyUser, ready, authenticated, logout, unlinkWallet: privyUnlinkWallet } = usePrivy();
  const { login: privyLogin } = useLogin();
  const [tick, setTick] = useState(0);
  const [guest, setGuest] = useState(() => localStorage.getItem("sentinel_guest") === "true");
  const [privyTimedOut, setPrivyTimedOut] = useState(false);

  useEffect(() => {
    if (ready || guest) return;
    const id = setTimeout(() => setPrivyTimedOut(true), 4000);
    return () => clearTimeout(id);
  }, [ready, guest]);

  const user: User | null = useMemo(() => {
    if (guest) return GUEST_USER;
    if (!privyUser || !authenticated) return null;
    return {
      id: privyUser.id,
      email: privyUser.email?.address ?? "",
      wallet: privyUser.wallet?.address ?? null,
      name: privyUser.email?.address?.split("@")[0] ?? null,
      onboardingComplete: getOnboardingComplete(),
    };
  }, [guest, privyUser, authenticated, tick]);

  const loginAsGuest = useCallback(() => {
    localStorage.setItem("sentinel_guest", "true");
    setGuest(true);
  }, []);

  const signIn = useCallback(
    async (e?: React.MouseEvent) => {
      localStorage.removeItem("sentinel_guest");
      setGuest(false);
      privyLogin(e);
    },
    [privyLogin],
  );

  const signUp = useCallback(
    async (e?: React.MouseEvent) => {
      privyLogin(e);
    },
    [privyLogin],
  );

  const connectWallet = useCallback(
    async (e?: React.MouseEvent) => {
      privyLogin({ loginMethods: ["wallet"] });
    },
    [privyLogin],
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
    localStorage.removeItem("sentinel_guest");
    setGuest(false);
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
      isLoading: !ready && !guest && !privyTimedOut,
      isReady: ready || guest || privyTimedOut,
      isGuest: guest,
      signUp,
      signIn,
      connectWallet,
      unlinkWallet,
      signOut,
      updateUser,
      loginAsGuest,
    }),
    [user, ready, guest, privyTimedOut, signUp, signIn, connectWallet, unlinkWallet, signOut, updateUser, loginAsGuest],
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
      <PrivyAuthProvider>
        {children}
      </PrivyAuthProvider>
    </PrivyProvider>
  );
}
