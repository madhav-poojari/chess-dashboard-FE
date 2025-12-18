import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { refreshToken } from "../api/auth/authService";
import { tokenStorage } from "../api/tokenStorage";

export function useBootstrapAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
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
  }, [navigate]);
}
