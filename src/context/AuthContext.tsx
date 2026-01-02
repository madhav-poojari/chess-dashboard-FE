// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type User = {
  id: string;
  name: string;
  email?: string;
  // single role per user (as you requested)
  role: string; // e.g. "admin" | "mentor" | "student"
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { fetchMe } from "../api/user/service";

async function fetchCurrentUser(): Promise<User | null> {
  try {
    const user = await fetchMe();
    return {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      role: user.role
    };
  } catch (error) {
    console.error("fetchCurrentUser failed:", error);
    // If 401/403 or network error, return null
    return null;
  }
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
