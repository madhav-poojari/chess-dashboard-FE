// authService.ts
import axios from "axios";
import { tokenStorage } from "../tokenStorage";

const API_BASE = import.meta.env.VITE_API_BASE as string || "";

export interface RefreshResponse { access_token: string; }
export interface LoginForm { email: string; password: string }
export interface LoginResponse { access_token: string; expires_in?: number; }
export interface SignupForm { 
  email: string; 
  password: string; 
  first_name: string; 
  last_name: string; 
  role?: string; 
}
export interface SignupResponse { user_id: string; role?: string; }

let logoutRedirect = () => { 
  // Prevent reload if already on signin page to avoid refresh loops
  if (window.location.pathname === "/signin") {
    return;
  }
  window.location.href = "/signin"; 
};

export const setLogoutRedirect = (fn: () => void) => { logoutRedirect = fn; };

export const refreshToken = async (): Promise<string> => {
  // calls backend which reads httpOnly refresh cookie and returns new access token
  const url = `${API_BASE}/auth/refresh`;
  const res = await axios.post(url, {}, { withCredentials: true });
  if (!res?.data?.data?.access_token) throw new Error("no_access_token");
  tokenStorage.set(res.data.data.access_token);
  return res.data.data.access_token;
};

export const loginByEmail = async (loginForm: LoginForm): Promise<LoginResponse> => {
  // calls backend which reads httpOnly refresh cookie and returns new access token
  const url = `${API_BASE}/auth/login`;
  loginForm.email = loginForm.email.trim().toLowerCase();
  const res = await axios.post(url, loginForm, { withCredentials: true });
  if (!res?.data?.data?.access_token) throw new Error("no_access_token");
  tokenStorage.set(res.data.data.access_token);
  return { access_token: res.data.data.access_token };
};
export const signup = async (signupForm: SignupForm): Promise<SignupResponse> => {
  const url = `${API_BASE}/auth/signup`;
  const res = await axios.post(url, signupForm);
  if (!res?.data?.data?.user_id) throw new Error("signup_failed");
  return { 
    user_id: res.data.data.user_id,
    role: res.data.data.role 
  };
};

export const logout = async () => {
  try {
    await axios.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true });
  } catch { /* ignore */ }
  tokenStorage.remove();
  logoutRedirect();
};
