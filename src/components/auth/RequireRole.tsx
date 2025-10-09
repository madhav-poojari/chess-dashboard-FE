// src/components/RequireRole.tsx
import React from "react";
import { useAuth } from "../../context/AuthContext";
import NotFound from "../../pages/OtherPage/NotFound";

type Props = {
  allowedRoles: string[]; // roles that can access the child
  children: React.ReactElement;
  requireAuth?: boolean; // default true; if false, allow public + role check
};

export default function RequireRole({ allowedRoles, children, requireAuth = true }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    // while we know the role, show loader (avoid flicker)
    return <div>Loading...</div>;
  }

  // if auth required and no user -> show 404
  if (requireAuth && !user) {
    return <NotFound />;
  }

  // if allowedRoles empty -> allow any authenticated user
  if (!allowedRoles || allowedRoles.length === 0) {
    return children;
  }

  // user has a single role; check membership
  const role = user?.role ?? null;
  if (!role || !allowedRoles.includes(role)) {
    // render 404 to hide page existence
    return <NotFound />;
  }

  return children;
}
