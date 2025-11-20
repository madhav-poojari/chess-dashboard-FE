// src/api/user/publicProfile.ts
import { fetchMe } from "./service";
import { toPublicProfile } from "./mapper";
import { PublicProfile } from "../../models/publicProfile";

export const userPublicProfile = async (): Promise<PublicProfile> => {
  const user = await fetchMe();
  return toPublicProfile(user);
};
