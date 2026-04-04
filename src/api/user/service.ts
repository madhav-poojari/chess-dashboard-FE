// src/api/user/service.ts
// import { apiFetch } from "../../api/client";
// import { ApiResponse, User } from "./dto";

// export const fetchMe = async (): Promise<User> => {
//   const res = await apiFetch<ApiResponse<User>>("/api/v1/users/me", { method: "GET" });
//   return res.data;
// };

import { PublicProfile } from "../../models/publicProfile";
import api from "../axiosInstance";
import { ApiResponse, StudentSummary, User } from "./dto";

export const fetchMe = async (): Promise<User> => {
  const res = await api.get("/users/me");
  const data: ApiResponse<User> = res.data;
  return data.data;
};

export const updateProfile = async (userProfle: Partial<PublicProfile>): Promise<User> => {
  console.log("Updating profile with data:", userProfle);
  const userId = userProfle.uid;

  // Convert camelCase frontend fields to snake_case for backend API
  const payload: Record<string, unknown> = {};

  if (userProfle.first_name !== undefined) payload.first_name = userProfle.first_name;
  if (userProfle.last_name !== undefined) payload.last_name = userProfle.last_name;
  if (userProfle.bio !== undefined) payload.bio = userProfle.bio;
  if (userProfle.city !== undefined) payload.city = userProfle.city;
  if (userProfle.state !== undefined) payload.state = userProfle.state;
  if (userProfle.country !== undefined) payload.country = userProfle.country;
  if (userProfle.postal_code !== undefined) payload.zipcode = userProfle.postal_code;
  if (userProfle.profile_picture_url !== undefined) payload.profile_picture_url = userProfle.profile_picture_url;

  // Chess platform IDs - convert camelCase to snake_case
  if (userProfle.lichessId !== undefined) payload.lichess_username = userProfle.lichessId;
  if (userProfle.chessdotcomId !== undefined) payload.chesscom_username = userProfle.chessdotcomId;
  if (userProfle.uscfId !== undefined) payload.uscf_id = userProfle.uscfId;
  if (userProfle.fideId !== undefined) payload.fide_id = userProfle.fideId;
  if (userProfle.syllabus_url !== undefined) payload.syllabus_url = userProfle.syllabus_url;
  if (userProfle.personal_meet_link !== undefined) payload.personal_meet_link = userProfle.personal_meet_link;
  if (userProfle.added_in_whatsapp !== undefined) payload.added_in_whatsapp = userProfle.added_in_whatsapp;

  const res = await api.put(`/users/${userId}`, payload);
  
  const data: ApiResponse<User> = res.data;
  console.log("Profile update response:", data);
  return data.data;
};

export const fetchStudents = async (): Promise<User[]> => {
  const res = await api.get("/users/");
  const data: ApiResponse<User[]> = res.data;
  return data.data.filter((user) => user.role.toLowerCase() === "student");
};

export const fetchStudentSummaries = async (): Promise<StudentSummary[]> => {
  const res = await api.get("/users/students");
  const data: ApiResponse<StudentSummary[]> = res.data;
  return data.data;
};

export const fetchUserById = async (userId: string): Promise<User> => {
  const endpoint = `/users/${userId}`;
  console.log("Calling API:", api.defaults.baseURL + endpoint);
  const res = await api.get(`/users/${userId}`);
  console.log("Response Data:", res.data);
  const data: ApiResponse<User> = res.data;
  return data.data;
};

export const resetOwnPassword = async (newPassword: string): Promise<void> => {
  await api.post("/users/reset-password", {
    new_password: newPassword,
  });
};


