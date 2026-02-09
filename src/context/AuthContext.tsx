// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

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
  const [hasFetched, setHasFetched] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Skip fetching user on auth pages to prevent potential refresh loops
    const authRoutes = ['/signin', '/signup', '/oauth/google-callback', '/pending-approval'];
    if (authRoutes.includes(location.pathname)) {
      setLoading(false);
      return;
    }

    // Only fetch user once and not on every route change
    if (hasFetched) {
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const u = await fetchCurrentUser();
        if (mounted) {
          setUser(u);
          setHasFetched(true);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
        if (mounted) {
          setUser(null);
          setHasFetched(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [location.pathname, hasFetched]);

  // Wrapper to reset hasFetched when user is cleared (logout)
  const handleSetUser = (u: User | null) => {
    setUser(u);
    if (u === null) {
      setHasFetched(false); // Allow re-fetching on next login
    }
  };

  const value = useMemo(() => ({ user, loading, setUser: handleSetUser }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
