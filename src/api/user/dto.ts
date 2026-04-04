import { GuidanceInfo } from "../../models/publicProfile";

// src/api/user/dto.ts
export enum UserRole {
  STUDENT = "student",
  COACH = "coach",
  MENTOR_COACH = "mentor",
  ADMIN = "admin"
}

export interface UserDetails {
  user_id: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  phone: string;
  dob: string | null;
  bio: string;
  profile_picture_url: string;
  additional_info: Record<string, unknown>;
  updated_at: string;
  lichess_username: string;
  uscf_id: string;
  chesscom_username: string;
  fide_id: string;
  syllabus_url: string;
  added_in_whatsapp: boolean;
  personal_meet_link: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  approved: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  details: UserDetails;

  current_lesson_plan?: string;
  mentor?: GuidanceInfo;
  coach?: GuidanceInfo;
}

export interface StudentSummary {
  id: string;
  first_name: string;
  last_name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
