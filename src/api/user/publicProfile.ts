// src/api/user/publicProfile.ts
import { fetchMe, fetchUserById } from "./service";
import { toPublicProfile } from "./mapper";
import { PublicProfile } from "../../models/publicProfile";

export const userPublicProfile = async (userId?: string): Promise<PublicProfile> => {
  const user = userId ? await fetchUserById(userId) : await fetchMe();
  return toPublicProfile(user);
};
