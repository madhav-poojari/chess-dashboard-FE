// src/api/user/service.ts
// import { apiFetch } from "../../api/client";
// import { ApiResponse, User } from "./dto";

// export const fetchMe = async (): Promise<User> => {
//   const res = await apiFetch<ApiResponse<User>>("/api/v1/users/me", { method: "GET" });
//   return res.data;
// };

import { PublicProfile } from "../../models/publicProfile";
import api from "../axiosInstance";
import { ApiResponse, User } from "./dto";

export const fetchMe = async (): Promise<User> => {
  const res = await api.get("/users/me");
  const data: ApiResponse<User> = res.data;
  return data.data; 
};

export const updateProfile = async (userProfle: Partial<PublicProfile>): Promise<User> => {
  const userId = userProfle.uid;
  const res = await api.put(`/users/${userId}`, userProfle);
  const data: ApiResponse<User> = res.data;
  return data.data;
};

export const fetchStudents = async (): Promise<User[]> => {
  const res = await api.get("/users/");
  const data: ApiResponse<User[]> = res.data;
  return data.data;
};

export const fetchUserById = async (userId: string): Promise<User> => {
  const res = await api.get(`/users/${userId}`);
  const data: ApiResponse<User> = res.data;
  return data.data;
};

export const resetOwnPassword = async (newPassword: string): Promise<void> => {
  await api.post("/users/reset-password", {
    new_password: newPassword,
  });
};


