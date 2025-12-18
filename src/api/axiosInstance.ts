// axiosInstance.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { tokenStorage } from "./tokenStorage";
import { refreshToken, logout } from "./auth/authService";

const API_BASE = import.meta.env.VITE_API_BASE as string || "";

const instance: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true // include cookies (refresh token cookie)
});

/**
 * Request interceptor: attach Authorization header if access token present.
 */
instance.interceptors.request.use((config: AxiosRequestConfig) => {
  console.log("inside request interceptor ")

  const token = tokenStorage.get();
  if (token && config && config.headers) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }
  return config;
});

/**
 * Response interceptor: on 401 try to refresh once and retry original request.
 * Handles concurrent requests by queueing them while a refresh is in-flight.
 */
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
type PendingReq = {
  resolve: (value: AxiosResponse<any> | Promise<AxiosResponse<any>>) => void;
  reject: (err?: any) => void;
  config: AxiosRequestConfig;
};
const pendingQueue: PendingReq[] = [];

const processQueue = (error: any | null, token?: string) => {
  pendingQueue.forEach(({ resolve, reject, config }) => {
    console.log("pending queue len- ", pendingQueue.length)
    console.log("error in queue processing ", error)
    if (error) reject(error);
    else {
      if (token && config.headers) config.headers["Authorization"] = `Bearer ${token}`;
      resolve(instance.request(config));
    }
  });
  pendingQueue.length = 0;
};

instance.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const originalConfig = err.config as AxiosRequestConfig & { _retry?: boolean };
    console.log("inside response interceptor ")

    // If no config or no response -> propagate
    if (!originalConfig || !err.response) return Promise.reject(err);

    // If not 401 propagate
    if (err.response.status !== 401) return Promise.reject(err);

    // avoid infinite loop: if endpoint is refresh or logout -> logout
    const url = originalConfig.url || "";
    if (url.includes("/auth/refresh") || url.includes("/auth/logout")) {
      await logout();
      return Promise.reject(err);
    }

    // Mark retry
    if (originalConfig._retry) return Promise.reject(err);
    originalConfig._retry = true;

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject, config: originalConfig });
      });
    }
    console.log("about to refreshing ")

    // Start refresh
    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        const newToken = await refreshToken(); // calls backend and sets token in storage
        processQueue(null, newToken);
        return newToken;
      } catch (refreshErr) {

        processQueue(refreshErr, undefined);
        console.log("refreshError - ",JSON.stringify(refreshErr))
        // perform logout / redirect
        await logout();
        throw refreshErr;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    })();

    try {
      const token = await refreshPromise;
      // attach header and retry original request
      if (token && originalConfig.headers) {
        originalConfig.headers["Authorization"] = `Bearer ${token}`;
      }
      return instance.request(originalConfig);
    } catch (e) {
      return Promise.reject(e);
    }
  }
);

export default instance;
