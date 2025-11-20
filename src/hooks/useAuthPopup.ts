import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

type OAuthMessage = { type: "oauth"; success: boolean; state?: string; error?: string; status?:number };

export default function useAuthPopup() {
  const navigate = useNavigate();

  return useCallback(({ url, state }: { url: string; state: string }) => {
    // store state locally so we can validate it when popup posts back
    sessionStorage.setItem("oauth_state", state);

    const popup = window.open(url, "google_oauth", "width=500,height=650");

    const handler = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      const msg = ev.data as OAuthMessage | undefined;
      if (!msg || msg.type !== "oauth") return;

      const saved = sessionStorage.getItem("oauth_state");
      sessionStorage.removeItem("oauth_state");

      if (msg.state && saved !== msg.state) {
        console.error("OAuth state mismatch");
        return;
      } 

      window.removeEventListener("message", handler);
      popup?.close();

      if (msg.success) {
        // main window redirects to dashboard (backend already set httpOnly cookie)
        navigate("/");
      }
      else if(msg.status && msg.status == 403){
        console.log("User not apporved", msg.error);
        navigate(`/pending-approval`);
      } 
      else {
        console.error("OAuth failed:", msg.error);
        navigate(`/signin?error=${encodeURIComponent(msg.error || "oauth_failed")}`);
      }
    };

    window.addEventListener("message", handler);
  }, [navigate]);
}
