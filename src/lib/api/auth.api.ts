import { Platform } from "react-native";
import { api } from "./client";
import { tokenStorage } from "../storage/tokenStorage";
import { authState } from "../storage/authState";

export type RegisterPayload = {
  fullName: string;
  email: string;
  username: string;
  password: string;
  avatar?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
  confirmPassword: string;
};

export type TwoFactorEnablePayload = {
  code: string;
};

export type TwoFactorVerifyLoginPayload = {
  challengeToken: string;
  code: string;
  useRecoveryCode?: boolean;
};

export type TwoFactorDisablePayload = {
  code: string;
};

export type DeleteAccountPayload = {
  confirmation: string;
  password?: string;
  code?: string;
  useRecoveryCode?: boolean;
};

export type SessionItem = {
  id: string;
  device?: string;
  browser?: string;
  os?: string;
  deviceType?: "desktop" | "mobile" | "tablet" | string;
  location?: string;
  lastActivity?: string;
  createdAt?: string;
  lastActiveLabel?: string;
  current?: boolean;
};

export type SecurityStatus = {
  twoFactorEnabled: boolean | null;
  loginAlerts: boolean | null;
};

export const getChallengeToken = (res: any): string | null => {
  const t =
    res?.data?.data?.challengeToken ??
    res?.data?.challengeToken ??
    res?.challengeToken ??
    null;
  return typeof t === "string" && t.length > 0 ? t : null;
};

export type AuthResponse = {
  token?: any;
  accessToken?: any;
  data?: any;
  user?: any;
  message?: string;
  requires2FA?: boolean;
  [key: string]: any;
};

export const apiErrorMessage = (
  error: any,
  fallback = "Something went wrong",
) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  (error?.code === "ERR_NETWORK"
    ? "Network error. Check your connection."
    : "") ||
  error?.message ||
  fallback;

const asToken = (v: any): string | null =>
  typeof v === "string" && v.length > 0 ? v.replace(/^Bearer\s+/i, "") : null;

const pickToken = (res: { data?: any; headers?: any }): string | null => {
  const data = res?.data;
  const candidates = [
    data?.token,
    data?.accessToken,
    data?.access_token,
    data?.data?.token,
    data?.data?.accessToken,
    data?.data?.access_token,
    data?.tokens,
    data?.data?.tokens,
    data?.session,
    data?.data?.session,
  ];

  for (const c of candidates) {
    const direct = asToken(c);
    if (direct) return direct;

    if (c && typeof c === "object") {
      const inner = asToken(c.accessToken ?? c.access_token ?? c.token);
      if (inner) return inner;
    }
  }

  const h = res?.headers ?? {};
  return (
    asToken(h["authorization"]) ??
    asToken(h["x-access-token"]) ??
    asToken(h["x-auth-token"])
  );
};

const saveToken = async (res: { data?: any; headers?: any }) => {
  const token = pickToken(res);

  if (!token) {
    console.log(
      "No token in response. body keys:",
      Object.keys(res?.data ?? {}),
      "data keys:",
      Object.keys(res?.data?.data ?? {}),
      "header keys:",
      Object.keys(res?.headers ?? {}),
    );
    return false;
  }

  await tokenStorage.set(token);
  return true;
};

const finishAuth = async (res: { data?: any; headers?: any }) => {
  console.log("FINISH AUTH called, token found in response:", !!pickToken(res));

  const saved = await saveToken(res);

  if (Platform.OS === "web") {
    authState.set(true);
    return;
  }

  if (!saved) {
    authState.set(false);
    throw new Error(
      "Signed in, but the server did not send an access token. Backend must return it in the response body.",
    );
  }

  authState.set(true);
};

const logError = (label: string, error: any) => {
  console.log(
    `${label}:`,
    error?.code,
    error?.message,
    error?.response?.status,
    error?.response?.data,
  );
};

const pickUser = (d: any) => d?.user ?? d?.data?.user ?? d?.data ?? d;

export const authApi = {
  async register({
    fullName,
    email,
    username,
    password,
    avatar,
  }: RegisterPayload) {
    try {
      const form = new FormData();

      form.append("fullName", fullName.trim());
      form.append("email", email.trim().toLowerCase());
      form.append("username", username.trim());
      form.append("password", password);

      if (avatar) {
        if (Platform.OS === "web") {
          const blob = await (await fetch(avatar)).blob();
          const wext = (blob.type.split("/")[1] || "jpg").split("+")[0];

          form.append("avatar", blob, `avatar.${wext}`);
        } else {
          const ext = (
            avatar.split("?")[0].split(".").pop() || "jpg"
          ).toLowerCase();

          const mime =
            ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;

          form.append("avatar", {
            uri: avatar,
            name: `avatar.${ext}`,
            type: mime,
          } as any);
        }
      }

      const res = await api.post<AuthResponse>("/auth/register", form, {
        headers:
          Platform.OS === "web"
            ? undefined
            : { "Content-Type": "multipart/form-data" },
      });

      await finishAuth(res);

      return res.data;
    } catch (error: any) {
      logError("Register error", error);
      throw error;
    }
  },

  async login(payload: LoginPayload) {
    try {
      const res = await api.post<AuthResponse>("/auth/login", {
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
      });

      if (
        res.data?.requires2FA ||
        res.data?.data?.requires2FA ||
        getChallengeToken(res)
      ) {
        console.log("LOGIN: 2FA required, no token yet (expected)");
        return res;
      }

      await finishAuth(res);

      return res;
    } catch (error: any) {
      logError("Login error", error);
      throw error;
    }
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } catch (error: any) {
      logError("Logout error", error);
    } finally {
      await tokenStorage.clear();
      authState.set(false);
    }
  },

  async check(force = false): Promise<boolean> {
    if (Platform.OS !== "web" && !(await tokenStorage.get())) {
      authState.set(false);
      return false;
    }

    if (!force) {
      const cached = authState.get();
      if (cached !== null) return cached;
    }

    try {
      const res = await api.get("/auth/check", {
        validateStatus: () => true,
      });

      const d = res.data;

      const ok =
        res.status === 200 &&
        d?.authenticated !== false &&
        d?.isAuthenticated !== false;

      authState.set(ok);
      return ok;
    } catch {
      return !!(await tokenStorage.get());
    }
  },

  async changePassword({
    currentPassword,
    newPassword,
    confirmPassword,
  }: ChangePasswordPayload) {
    try {
      const { data } = await api.patch<AuthResponse>("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      return data;
    } catch (error: any) {
      logError("Change password error", error);
      throw error;
    }
  },

  async forgotPassword({ email }: ForgotPasswordPayload) {
    try {
      const { data } = await api.post<AuthResponse>("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
        platform: Platform.OS === "web" ? "web" : "mobile",
      });

      return data;
    } catch (error: any) {
      logError("Forgot password error", error);
      throw error;
    }
  },

  async resetPassword({
    token,
    password,
    confirmPassword,
  }: ResetPasswordPayload) {
    try {
      const { data } = await api.post<AuthResponse>(
        `/auth/reset-password/${encodeURIComponent(token)}`,
        { password, confirmPassword },
      );

      return data;
    } catch (error: any) {
      logError("Reset password error", error);
      throw error;
    }
  },

  async setup2FA() {
    try {
      const { data } = await api.post<AuthResponse>("/auth/2fa/setup");

      return data;
    } catch (error: any) {
      logError("2FA setup error", error);
      throw error;
    }
  },

  async enable2FA({ code }: TwoFactorEnablePayload) {
    try {
      const { data } = await api.post<AuthResponse>("/auth/2fa/enable", {
        code: code.trim(),
      });

      return data;
    } catch (error: any) {
      logError("2FA enable error", error);
      throw error;
    }
  },

  async verify2FALogin(payload: TwoFactorVerifyLoginPayload) {
    try {
      const body = {
        challengeToken: payload.challengeToken,
        code: payload.code.trim(),
        useRecoveryCode: !!payload.useRecoveryCode,
      };

      const res = await api.post<AuthResponse>("/auth/2fa/verify-login", body);

      await finishAuth(res);

      return res.data;
    } catch (error: any) {
      logError("2FA login verification error", error);
      throw error;
    }
  },

  async disable2FA({ code }: TwoFactorDisablePayload) {
    try {
      const { data } = await api.post<AuthResponse>("/auth/2fa/disable", {
        code: code.trim(),
      });

      return data;
    } catch (error: any) {
      logError("2FA disable error", error);
      throw error;
    }
  },

  async regenerateRecoveryCodes({ code }: TwoFactorEnablePayload) {
    try {
      const { data } = await api.post<AuthResponse>(
        "/auth/2fa/recovery-codes/regenerate",
        { code: code.trim() },
      );

      return data;
    } catch (error: any) {
      logError("Recovery codes regeneration error", error);
      throw error;
    }
  },

  async getSecurityStatus(): Promise<SecurityStatus> {
    try {
      const res = await api.get("/auth/check");
      const user = pickUser(res.data);

      const tf =
        user?.twoFactorEnabled ??
        user?.isTwoFactorEnabled ??
        user?.is2FAEnabled ??
        user?.twoFactor?.enabled ??
        null;

      const la = user?.loginAlerts ?? null;

      return {
        twoFactorEnabled: typeof tf === "boolean" ? tf : null,
        loginAlerts: typeof la === "boolean" ? la : null,
      };
    } catch (error: any) {
      logError("Security status error", error);
      return { twoFactorEnabled: null, loginAlerts: null };
    }
  },

  async get2FAStatus(): Promise<boolean | null> {
    return (await authApi.getSecurityStatus()).twoFactorEnabled;
  },

  async getLoginAlerts(): Promise<boolean | null> {
    return (await authApi.getSecurityStatus()).loginAlerts;
  },

  async setLoginAlerts(enabled: boolean): Promise<boolean> {
    try {
      const { data } = await api.patch<AuthResponse>(
        "/auth/security/login-alerts",
        { enabled },
      );

      const value = data?.data?.loginAlerts ?? data?.loginAlerts;
      return typeof value === "boolean" ? value : enabled;
    } catch (error: any) {
      logError("Login alerts error", error);
      throw error;
    }
  },

  async getSessions(): Promise<SessionItem[]> {
    try {
      const res = await api.get("/auth/sessions");
      const list = res.data?.data?.sessions ?? res.data?.sessions ?? [];
      return Array.isArray(list) ? list : [];
    } catch (error: any) {
      logError("Get sessions error", error);
      throw error;
    }
  },

  async revokeSession(sessionId: string) {
    try {
      const { data } = await api.delete<AuthResponse>(
        `/auth/sessions/${encodeURIComponent(sessionId)}`,
      );
      return data;
    } catch (error: any) {
      logError("Revoke session error", error);
      throw error;
    }
  },

  async revokeOtherSessions(): Promise<number> {
    try {
      const { data } = await api.post<AuthResponse>(
        "/auth/sessions/revoke-others",
      );
      return Number(data?.data?.revokedCount ?? data?.revokedCount ?? 0);
    } catch (error: any) {
      logError("Revoke other sessions error", error);
      throw error;
    }
  },

  async deleteAccount({
    confirmation,
    password,
    code,
    useRecoveryCode,
  }: DeleteAccountPayload) {
    try {
      const body: Record<string, unknown> = {
        confirmation: confirmation.trim(),
      };

      if (password) body.password = password;
      if (code?.trim()) {
        body.code = code.trim();
        body.useRecoveryCode = !!useRecoveryCode;
      }

      const { data } = await api.delete<AuthResponse>("/auth/account", {
        data: body,
      });

      await tokenStorage.clear();
      authState.set(false);

      return data;
    } catch (error: any) {
      logError("Delete account error", error);
      throw error;
    }
  },
};

export const performLogout = async (opts?: { everywhere?: boolean }) => {
  if (opts?.everywhere) {
    try {
      await authApi.revokeOtherSessions();
    } catch (error: any) {
      logError("Logout everywhere error", error);
    }
  }

  await authApi.logout();
};
