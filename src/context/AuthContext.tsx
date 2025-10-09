// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type User = {
  id: string;
  name: string;
  email?: string;
  // single role per user (as you requested)
  role: string; // e.g. "admin" | "instructor" | "student"
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchCurrentUser(): Promise<User | null> {
  // TODO: replace with your real API call, e.g. fetch('/api/me')...
  // Simulated example (return null if not logged in)
  return new Promise((res) =>
    setTimeout(
      () =>
        res({
          id: "u1",
          name: "Madhava Poojari",
          email: "madhava@example.com",
          role: "student", // change for testing
        }),
      300
    )
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await fetchCurrentUser();
        if (!mounted) return;
        setUser(u);
      } catch (err) {
        console.error("Failed to fetch user", err);
        if (!mounted) return;
        setUser(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(() => ({ user, loading, setUser }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
