// src/api/user/service.ts
import { apiFetch } from "../../api/client";
import { ApiResponse, User } from "./dto";

export const fetchMe = async (): Promise<User> => {
  const res = await apiFetch<ApiResponse<User>>("/users/me", { method: "GET" });
  return res.data;
};
