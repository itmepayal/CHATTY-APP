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
};

export type TwoFactorEnablePayload = {
  code: string;
};

export type TwoFactorVerifyLoginPayload = {
  // returned by /auth/login when the account has 2FA enabled
  challengeToken: string;
  // authenticator code, or a recovery code when useRecoveryCode is true
  code: string;
  useRecoveryCode?: boolean;
};

export type TwoFactorDisablePayload = {
  // current authenticator code only (recovery codes are NOT accepted)
  code: string;
};

/** Finds the 2FA challengeToken in a /auth/login response (or null). */
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

/** Pulls a readable message out of an axios error. */
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

const pickToken = (data: any): string | null => {
  const candidates = [
    data?.token,
    data?.accessToken,
    data?.data?.token,
    data?.data?.accessToken,
    data?.tokens,
    data?.data?.tokens,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c;

    if (c && typeof c === "object") {
      const inner = c.accessToken ?? c.token;
      if (typeof inner === "string" && inner.length > 0) return inner;
    }
  }

  return null;
};

const saveToken = async (data: AuthResponse) => {
  const token = pickToken(data);

  if (!token) {
    console.log("No string token in response. Keys:", Object.keys(data ?? {}));
    return;
  }

  try {
    await tokenStorage.set(token);
  } catch (e) {
    console.log("Could not persist token", e);
  }
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

      const { data } = await api.post<AuthResponse>("/auth/register", form, {
        headers:
          Platform.OS === "web"
            ? undefined
            : { "Content-Type": "multipart/form-data" },
      });

      await saveToken(data);
      authState.set(true);

      return data;
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
        return res;
      }

      await saveToken(res.data);
      authState.set(true);

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
      });

      return data;
    } catch (error: any) {
      logError("Forgot password error", error);
      throw error;
    }
  },

  async resetPassword({ token, password }: ResetPasswordPayload) {
    try {
      const { data } = await api.post<AuthResponse>(
        `/auth/reset-password/${encodeURIComponent(token)}`,
        { password },
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

      const { data } = await api.post<AuthResponse>(
        "/auth/2fa/verify-login",
        body,
      );

      await saveToken(data);

      const token = pickToken(data);

      if (token) {
        authState.set(true);
      }

      return data;
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
};
