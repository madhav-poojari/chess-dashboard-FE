interface AuthUrlOptions {
    clientId: string;
    redirectUri: string;
    state: string;
  }
  
  export const buildGoogleAuthUrl = ({
    clientId,
    redirectUri,
    state
  }: AuthUrlOptions): string => {
    return (
      "https://accounts.google.com/o/oauth2/v2/auth?" +
      new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "consent",
        state
      }).toString()
    );
  };
  