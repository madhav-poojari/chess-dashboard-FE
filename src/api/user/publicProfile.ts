// src/api/user/publicProfile.ts
import { fetchMe, fetchUserById } from "./service";
import { toPublicProfile } from "./mapper";
import { PublicProfile } from "../../models/publicProfile";

export const userPublicProfile = async (userId?: string): Promise<PublicProfile> => {
  console.log("in user public profile, userId:", userId);
  const user = userId ? await fetchUserById(userId) : await fetchMe();
  console.log("Fetched user data:", user);
  return toPublicProfile(user);
};
