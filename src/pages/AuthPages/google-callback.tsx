import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GoogleCallback: React.FC = () => {
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    (async () => {
      const origin = window.location.origin;
      if (error) {
        window.opener?.postMessage({ type: "oauth", success: false, error, state }, origin);
        window.close();
        return;
      }
      if (!code) {
        window.opener?.postMessage({ type: "oauth", success: false, error: "missing_code", state }, origin);
        window.close();
        return;
      }

      try {
        // call backend to exchange code -> backend stores refresh token & sets httpOnly cookie
        const res = await fetch("http://localhost:8080/api/v1/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // important to receive httpOnly cookie
          body: JSON.stringify({ code, state })
        });
        console.log("im here, ",res)

        if (!res.ok) {
          const text = await res.text();
          const status = res.status;
          window.opener?.postMessage({ type: "oauth", success: false, error: text, state,status }, origin);
        } else {
          window.opener?.postMessage({ type: "oauth", success: true, state ,status}, origin);
        }
      } catch (err: any) {
        window.opener?.postMessage({ type: "oauth", success: false, error: err?.message || "network", state,status:0 }, origin);
      } finally {
        window.close();
      }
    })();
  }, [search]);

  return <p>Signing you in…</p>;
};

export default GoogleCallback;
