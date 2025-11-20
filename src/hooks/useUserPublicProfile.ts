// src/hooks/useUserPublicProfile.ts
import { useEffect, useState } from "react";
import { userPublicProfile } from "../api/user/publicProfile";
import { PublicProfile } from "../models/publicProfile";

export default function useUserPublicProfile() {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    userPublicProfile()
      .then((p) => mounted && setProfile(p))
      .catch((e) => mounted && setError(e as Error))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return { profile, loading, error };
}
