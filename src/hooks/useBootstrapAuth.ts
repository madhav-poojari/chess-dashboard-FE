import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { refreshToken } from "../api/auth/authService";
import { tokenStorage } from "../api/tokenStorage";

export function useBootstrapAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasInitialized = useRef(false);

  useEffect(() => {
    const init = async () => {
      // skipping refresh when already on auth pages
      const authRoutes = ['/signin', '/signup', '/oauth/google-callback', '/pending-approval'];
      if (authRoutes.includes(location.pathname)) {
        return;
      }

      // Only run initialization once, not on every route change
      if (hasInitialized.current) {
        return;
      }
      hasInitialized.current = true;

      const token = tokenStorage.get();
      if (token) return; // already have access token

      try {
        await refreshToken()
      } catch {
        tokenStorage.remove();
        navigate("/signin");
      }
    };

    init();
  }, [navigate, location.pathname]);
}
