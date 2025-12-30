// authService.ts
import axios from "axios";
import { tokenStorage } from "../tokenStorage";

const API_BASE = import.meta.env.VITE_API_BASE as string || "";

export interface RefreshResponse { access_token: string; }
export interface LoginForm { email: string; password: string }
export interface LoginResponse { access_token: string; expires_in?: number; }

let logoutRedirect = () => { window.location.href = "/signin"; };

export const setLogoutRedirect = (fn: () => void) => { logoutRedirect = fn; };

export const refreshToken = async (): Promise<string> => {
  // calls backend which reads httpOnly refresh cookie and returns new access token
  const url = `${API_BASE}/api/v1/auth/refresh`;
  const res = await axios.post(url, {}, { withCredentials: true });
  if (!res?.data?.data?.access_token) throw new Error("no_access_token");
  tokenStorage.set(res.data.data.access_token);
  return res.data.data.access_token;
};

export const loginByEmail = async (loginForm: LoginForm): Promise<LoginResponse> => {
  // calls backend which reads httpOnly refresh cookie and returns new access token
  const url = `${API_BASE}/api/v1/auth/login`;

  const res = await axios.post(url, loginForm,);
  if (!res?.data?.data?.access_token) throw new Error("no_access_token");
  tokenStorage.set(res.data.data.access_token);
  return { access_token: res.data.data.access_token };
};
export const logout = async () => {
  try {
    await axios.post(`${API_BASE}/api/v1/auth/logout`, {}, { withCredentials: true });
  } catch (e) { /* ignore */ }
  tokenStorage.remove();
  logoutRedirect();
};
