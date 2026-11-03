import { Platform } from "react-native";
import { api } from "./client";

/** true = console me raw responses dikhenge (debug ke baad false kar dena) */
const DEBUG = true;

export type UserAvatar = {
  public_id?: string;
  url?: string;
};

export type UserProfile = {
  _id: string;
  id: string;
  email: string;
  fullName: string;
  username: string;
  phone?: string;
  gender?: string;
  dob?: string;
  location?: string;
  website?: string;
  bio?: string;
  timezone?: string;
  avatar?: UserAvatar | null;
  blockedUsers?: string[];
  favorites?: string[];
  lastSeen?: string;
  twoFactorEnabled?: boolean;
  loginAlerts?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateProfilePayload = {
  fullName?: string;
  username?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  location?: string;
  website?: string;
  bio?: string;
  timezone?: string;
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

const dbg = (label: string, value: unknown) => {
  if (!DEBUG) return;
  try {
    console.log(label, JSON.stringify(value, null, 2));
  } catch {
    console.log(label, value);
  }
};

const isEmpty = (v: any) =>
  v === undefined || v === null || (typeof v === "string" && v.trim() === "");

/** Response ke alag-alag shapes me se user object nikalta hai */
const extractUser = (d: any): any | null => {
  const candidates = [
    d?.data?.user,
    d?.user,
    d?.data?.profile,
    d?.profile,
    d?.data,
    d,
  ];
  for (const c of candidates) {
    if (c && typeof c === "object" && (c._id || c.id || c.email)) {
      return c;
    }
  }
  return null;
};

/** Pehli non-empty value, given keys me se */
const firstOf = (o: any, keys: string[]): string | undefined => {
  for (const k of keys) {
    const v = o?.[k];
    if (!isEmpty(v) && (typeof v === "string" || typeof v === "number")) {
      return String(v);
    }
  }
  return undefined;
};

/** Backend ke alag key names ko hamare standard keys me map karta hai */
const normalizeUser = (raw: any): UserProfile | null => {
  if (!raw || typeof raw !== "object") return null;

  // kuch backends details ko nested "profile" me bhejte hain
  const src: any = {
    ...raw,
    ...(raw.profile && typeof raw.profile === "object" ? raw.profile : {}),
  };

  const out: any = { ...src };

  const map: Record<string, string[]> = {
    fullName: ["fullName", "fullname", "full_name", "name", "displayName"],
    username: ["username", "userName", "user_name", "handle"],
    phone: [
      "phone",
      "mobile",
      "phoneNumber",
      "phone_number",
      "mobileNumber",
      "mobile_number",
      "contact",
    ],
    gender: ["gender", "sex"],
    dob: ["dob", "dateOfBirth", "date_of_birth", "birthDate", "birthday"],
    location: ["location", "address", "city"],
    website: ["website", "portfolio", "url", "link"],
    bio: ["bio", "about", "description", "status"],
    timezone: ["timezone", "timeZone", "tz"],
  };

  for (const target of Object.keys(map)) {
    const v = firstOf(src, map[target]);
    if (v !== undefined) out[target] = v;
  }

  // avatar: object ya direct string dono handle
  if (typeof src.avatar === "string" && src.avatar) {
    out.avatar = { url: src.avatar };
  } else if (!src.avatar?.url) {
    const url = firstOf(src, ["avatarUrl", "avatar_url", "photo", "image"]);
    if (url) out.avatar = { url };
  }

  if (!out.id && out._id) out.id = out._id;
  if (!out._id && out.id) out._id = out.id;

  return out as UserProfile;
};

/** a ke upar b merge, lekin b ki khaali values a ko overwrite nahi karengi */
const mergeDefined = (a: any, b: any) => {
  const out = { ...(a ?? {}) };
  for (const k of Object.keys(b ?? {})) {
    if (!isEmpty(b[k])) out[k] = b[k];
  }
  return out;
};

const pickUser = (d: any): UserProfile | null => normalizeUser(extractUser(d));

const FIELDS: (keyof UpdateProfilePayload)[] = [
  "fullName",
  "username",
  "phone",
  "gender",
  "dob",
  "location",
  "website",
  "bio",
  "timezone",
];

// Poora profile data dene wale endpoints (jo mile use ho jayega)
const PROFILE_ENDPOINTS = ["/users/profile", "/users/me"];

export const userApi = {
  async getProfile(): Promise<UserProfile | null> {
    let merged: any = null;

    // 1) Poore profile wale endpoints
    for (const url of PROFILE_ENDPOINTS) {
      try {
        const res = await api.get(url);
        dbg(`RAW GET ${url} (${res.status}):`, res.data);
        const u = normalizeUser(extractUser(res.data));
        if (u) merged = mergeDefined(merged, u);
      } catch (error: any) {
        const s = error?.response?.status;
        console.log(
          `GET ${url} FAILED:`,
          s,
          error?.response?.data ?? error?.message,
        );
      }
    }

    // 2) /auth/check (basic data) - base ke taur par
    try {
      const res = await api.get("/auth/check");
      dbg("RAW GET /auth/check:", res.data);
      const u = normalizeUser(extractUser(res.data));
      // yahan base pehle rakho, phir full data upar
      if (u) merged = mergeDefined(u, merged ?? {});
    } catch (error: any) {
      if (!merged) {
        logError("Get profile error", error);
        throw error;
      }
    }

    dbg("FINAL PROFILE:", merged);
    return merged as UserProfile | null;
  },

  async updateProfile(
    payload: UpdateProfilePayload,
  ): Promise<UserProfile | null> {
    try {
      const body: Record<string, string> = {};

      for (const key of FIELDS) {
        const v = payload[key];
        if (typeof v === "string") body[key] = v.trim();
      }

      if (Object.keys(body).length === 0) {
        throw new Error("Nothing to update");
      }

      dbg("PATCH /users/profile body:", body);
      const { data } = await api.patch("/users/profile", body);
      dbg("PATCH /users/profile response:", data);
      return pickUser(data);
    } catch (error: any) {
      logError("Update profile error", error);
      throw error;
    }
  },

  async uploadAvatar(uri: string): Promise<UserProfile | null> {
    try {
      const form = new FormData();

      if (Platform.OS === "web") {
        const blob = await (await fetch(uri)).blob();
        const ext = (blob.type.split("/")[1] || "jpg").split("+")[0];
        form.append("avatar", blob, `avatar.${ext}`);
      } else {
        const ext = (uri.split("?")[0].split(".").pop() || "jpg").toLowerCase();
        const mime =
          ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;

        form.append("avatar", {
          uri,
          name: `avatar.${ext}`,
          type: mime,
        } as any);
      }

      const { data } = await api.patch("/users/profile/avatar", form, {
        headers:
          Platform.OS === "web"
            ? undefined
            : { "Content-Type": "multipart/form-data" },
      });

      return pickUser(data);
    } catch (error: any) {
      logError("Upload avatar error", error);
      throw error;
    }
  },

  async removeAvatar(): Promise<UserProfile | null> {
    try {
      const { data } = await api.delete("/users/profile/avatar");
      return pickUser(data);
    } catch (error: any) {
      logError("Remove avatar error", error);
      throw error;
    }
  },
};
