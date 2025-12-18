import React from "react";
import { useBootstrapAuth } from "../../hooks/useBootstrapAuth";

export default function AppBootstrap({ children }: { children: React.ReactNode }) {
  useBootstrapAuth();
  return <>{children}</>;
}
