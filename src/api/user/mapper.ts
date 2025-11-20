// src/api/user/mapper.ts
import { User } from "./dto";
import { PublicProfile } from "../../models/publicProfile";

export const toPublicProfile = (u: User): PublicProfile => ({
  first_name: u.first_name,
  last_name: u.last_name,
  email: u.email,
  uid: u.id,
  bio: u.details?.bio ?? "",
  country: u.details?.country ?? "",
  city: u.details?.city ?? "",
  state: u.details?.state ?? "",
  postal_code: u.details?.zipcode ?? "",
  profile_picture_url: u.details?.profile_picture_url,
});
