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
  const res =  await api.get("/api/v1/users/me");
  const data:ApiResponse<User> = res.data;
  return data.data;
};

export const updateProfile = async (userProfle:Partial<PublicProfile>): Promise<User> =>{
  const userId = userProfle.uid;
  const res = await api.put(`/api/v1/users/${userId}`,userProfle);
  const data:ApiResponse<User> = res.data;
  return data.data;
};


