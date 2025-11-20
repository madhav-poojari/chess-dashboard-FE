// src/models/publicProfile.ts
export interface PublicProfile {
    first_name: string;
    last_name: string;
    email: string;
    uid: string;
    bio: string;
    country: string;
    city: string;
    state: string;
    postal_code: string;
    profile_picture_url?: string;
  }
  