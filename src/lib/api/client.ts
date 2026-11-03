import { Platform } from "react-native";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "../storage/tokenStorage";
import { authState } from "../storage/authState";

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://chatty-backend-2l2t.onrender.com/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  withCredentials: Platform.OS === "web",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await tokenStorage.get();

      console.log(
        `REQ ${config.method?.toUpperCase()} ${config.url} | token attached:`,
        !!token,
      );

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      console.error("Request interceptor error:", error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error("Request configuration error:", error);
    return Promise.reject(error);
  },
);

let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

const NO_LOGOUT_ON_401 = [
  "/auth/login",
  "/auth/logout",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/change-password",
  "/auth/2fa/",
];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? "";
      const skip = NO_LOGOUT_ON_401.some((p) => url.startsWith(p));

      if (!skip) {
        try {
          await tokenStorage.clear();
          authState.set(false);
          onUnauthorized?.();
        } catch (storageError) {
          console.error("Unauthorized handling error:", storageError);
        }
      }
    }

    return Promise.reject(error);
  },
);

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return "The server is taking too long to respond. Please try again later.";
    }

    if (!error.response) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }

    const data = error.response.data;

    return (
      data?.message ||
      data?.error ||
      data?.errors?.[0]?.message ||
      `Something went wrong. Please try again. (Error ${error.response.status})`
    );
  }

  if (error instanceof Error) {
    return error.message || "An unexpected error occurred. Please try again.";
  }

  return "An unexpected error occurred. Please try again.";
};
