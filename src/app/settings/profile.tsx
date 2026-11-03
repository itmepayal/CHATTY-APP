import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Keyboard,
  Pressable,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActionSheet,
  Avatar,
  SheetAction,
  Text,
  Tint,
  fonts,
} from "../../components/ui";
import AppAlert from "../../components/common/AppAlert";
import {
  ActionButton,
  Page,
  SectionTitle,
} from "../../components/settings/settings";
import { alpha, makeUseStyles, useTheme } from "../../theme/theme";
import { apiErrorMessage } from "../../lib/api/auth.api";
import { userApi, UserProfile } from "../../lib/api/user.api";

/* ───────────────────────── Form helpers ───────────────────────── */

type Form = {
  fullName: string;
  username: string;
  gender: string;
  dob: string;
  phone: string;
  location: string;
  website: string;
  bio: string;
};
type FieldKey = keyof Form;
type Errors = Partial<Record<FieldKey, string>>;

const KEYS: FieldKey[] = [
  "fullName",
  "username",
  "gender",
  "dob",
  "phone",
  "location",
  "website",
  "bio",
];

// Backend jo values accept karta hai wahi rakho (Swagger example: "Female")
const GENDERS = ["Male", "Female", "Other"];

const BIO_MAX = 120;
const AVATAR = 96;
/** Avatar ke peeche halka glow. Chahiye to true kar do. */
const SHOW_HALO = false;
const LABEL_W = 96;
const BASE: Tint = ["#FFE8D6", "#C2410C"];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const toForm = (u: UserProfile | null): Form => ({
  fullName: u?.fullName ?? "",
  username: u?.username ?? "",
  gender: u?.gender ?? "",
  dob: (u?.dob ?? "").slice(0, 10),
  phone: u?.phone ?? "",
  location: u?.location ?? "",
  website: u?.website ?? "",
  bio: u?.bio ?? "",
});

/** "20261103" -> "2026-11-03" (typing ke saath auto format) */
const maskDob = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
};

const isValidDob = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  )
    return false;
  return y >= 1900 && dt.getTime() <= Date.now();
};

const validate = (f: Form): Errors => {
  const e: Errors = {};
  if (!f.fullName.trim()) e.fullName = "Name can't be empty";
  if (f.username.trim() && !/^[a-z0-9_.]{3,20}$/i.test(f.username.trim()))
    e.username = "3–20 letters, numbers, . or _";
  if (f.dob.trim() && !isValidDob(f.dob.trim()))
    e.dob = "Use a valid past date: YYYY-MM-DD";
  if (f.phone.trim() && !/^[+\d\s()-]{6,20}$/.test(f.phone.trim()))
    e.phone = "Enter a valid phone number";
  if (f.website.trim() && !/^https?:\/\/\S+\.\S+/i.test(f.website.trim()))
    e.website = "Start with http:// or https://";
  return e;
};

const joinedLabel = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `Joined ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const getCompletion = (f: Form, p: UserProfile | null) => {
  const items = [
    { label: "Photo", ok: !!p?.avatar?.url },
    { label: "Name", ok: !!f.fullName.trim() },
    { label: "Email", ok: !!p?.email },
    { label: "Username", ok: !!f.username.trim() },
    { label: "Phone", ok: !!f.phone.trim() },
    { label: "Gender", ok: !!f.gender },
    { label: "Birthday", ok: !!f.dob.trim() },
    { label: "Location", ok: !!f.location.trim() },
    { label: "Website", ok: !!f.website.trim() },
    { label: "Bio", ok: !!f.bio.trim() },
  ];
  const done = items.filter((i) => i.ok).length;
  return {
    done,
    total: items.length,
    percent: Math.round((done / items.length) * 100),
    missing: items.filter((i) => !i.ok).map((i) => i.label),
  };
};

/* ───────────────────────── Styles ─────────────────────────
   App-style: flat list rows (label left, value right),
   chhote font sizes (Two-Factor screen jaise)
────────────────────────────────────────────────────────── */

const useStyles = makeUseStyles((t) => ({
  stack: { gap: 26, paddingBottom: 8 },
  section: { gap: 4 },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },

  /* Hero (koi card/box nahi) */
  hero: { alignItems: "center" },
  avatarStage: {
    width: AVATAR + 40,
    height: AVATAR + 40,
    alignItems: "center",
    justifyContent: "center",
  },
  haloOuter: {
    position: "absolute",
    width: AVATAR + 40,
    height: AVATAR + 40,
    borderRadius: (AVATAR + 40) / 2,
    backgroundColor: alpha(t.colors.primary, 0.05),
  },
  haloInner: {
    position: "absolute",
    width: AVATAR + 20,
    height: AVATAR + 20,
    borderRadius: (AVATAR + 20) / 2,
    backgroundColor: alpha(t.colors.primary, 0.08),
  },
  avatarBox: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
  },
  avatarImg: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: alpha(t.colors.muted, 0.15),
  },
  avatarBusy: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: AVATAR / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha("#000000", 0.35),
  },
  camera: {
    position: "absolute",
    right: -2,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: t.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: t.colors.card,
  },
  sumName: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 24,
    color: t.colors.ink,
    includeFontPadding: false,
    textAlign: "center",
  },
  sumUser: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: t.colors.muted,
    includeFontPadding: false,
  },
  linkRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    columnGap: 18,
    rowGap: 6,
  },
  link: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  linkText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.primary,
    includeFontPadding: false,
  },
  linkDanger: { color: t.colors.error },
  dirtyRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dirtyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F59E0B",
  },
  dirtyText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 16,
    color: "#B45309",
    includeFontPadding: false,
  },

  /* Slim completion (card nahi) */
  slim: { gap: 8 },
  slimHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slimTitle: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 17,
    color: t.colors.ink,
    includeFontPadding: false,
  },
  slimPct: {
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    lineHeight: 17,
    color: t.colors.primary,
    includeFontPadding: false,
  },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: alpha(t.colors.muted, 0.16),
    overflow: "hidden",
  },
  fill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: t.colors.primary,
  },
  slimHint: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: t.colors.muted,
    includeFontPadding: false,
  },

  /* Group (list) */
  group: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: t.colors.hairline,
    backgroundColor: t.colors.card,
    overflow: "hidden",
  },

  /* Row: label left | value right */
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowCenter: { alignItems: "center" },
  rowFocused: { backgroundColor: alpha(t.colors.primary, 0.04) },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: t.colors.hairline,
  },
  labelCol: {
    width: LABEL_W,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 20,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    color: t.colors.ink,
    includeFontPadding: false,
  },
  labelFocused: { color: t.colors.primary },
  valueCol: { flex: 1, gap: 3 },
  input: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 20,
    color: t.colors.ink,
    paddingVertical: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
  },
  inputRowWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  inputLocked: { color: t.colors.muted },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: t.colors.muted,
    includeFontPadding: false,
  },
  fieldError: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 16,
    color: t.colors.error,
    includeFontPadding: false,
  },

  /* Gender segmented (row ke right me) */
  seg: {
    flex: 1,
    flexDirection: "row",
    padding: 3,
    gap: 3,
    borderRadius: 11,
    backgroundColor: alpha(t.colors.muted, 0.1),
  },
  segItem: {
    flex: 1,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  segItemActive: {
    backgroundColor: t.colors.primary,
  },
  segText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 17,
    color: t.colors.muted,
    includeFontPadding: false,
  },
  segTextActive: { color: "#FFFFFF", fontFamily: fonts.semiBold },

  /* Bio (stacked) */
  bioWrap: { paddingVertical: 13, paddingHorizontal: 16, gap: 8 },
  bioInput: {
    minHeight: 76,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.ink,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlignVertical: "top",
    includeFontPadding: false,
  },
  bioFoot: { flexDirection: "row", alignItems: "center", gap: 10 },
  bioTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: alpha(t.colors.muted, 0.16),
    overflow: "hidden",
  },
  bioFill: { height: 3, borderRadius: 2 },
  bioCount: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: t.colors.muted,
    includeFontPadding: false,
  },

  /* States */
  center: { alignItems: "center", paddingVertical: 56, gap: 14 },
  error: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: t.colors.error,
    textAlign: "center",
    includeFontPadding: false,
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: t.colors.muted,
    textAlign: "center",
    includeFontPadding: false,
  },
}));

/* ───────────────────────── Row (label left, value right) ───────────────────────── */

type RowProps = Omit<TextInputProps, "onChange"> & {
  label: string;
  verified?: boolean;
  error?: string;
  hint?: string;
  last?: boolean;
};

function Row({
  label,
  verified,
  error,
  hint,
  last,
  editable = true,
  style,
  onFocus,
  onBlur,
  ...rest
}: RowProps) {
  const st = useStyles();
  const { colors } = useTheme();
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const on = focused && editable;

  return (
    <Pressable
      onPress={() => ref.current?.focus()}
      disabled={!editable}
      style={[st.row, !last && st.rowDivider, on && st.rowFocused]}
    >
      <View style={st.labelCol}>
        <Text
          style={[
            st.label,
            on && st.labelFocused,
            !!error && { color: colors.error },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {verified ? (
          <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
        ) : null}
      </View>

      <View style={st.valueCol}>
        <View style={st.inputRowWrap}>
          <TextInput
            ref={ref}
            {...rest}
            editable={editable}
            selectionColor={colors.primary}
            placeholderTextColor={alpha(colors.muted, 0.6)}
            accessibilityLabel={label}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={[st.input, { flex: 1 }, !editable && st.inputLocked, style]}
          />
          {!editable ? (
            <Ionicons
              name="lock-closed"
              size={13}
              color={alpha(colors.muted, 0.7)}
            />
          ) : null}
        </View>

        {error ? (
          <Text style={st.fieldError}>{error}</Text>
        ) : hint ? (
          <Text style={st.hint}>{hint}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/* ───────────────────────── Screen ───────────────────────── */

export default function Profile() {
  const router = useRouter();
  const st = useStyles();
  const { colors } = useTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<Form>(toForm(null));
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | undefined>();

  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiErr, setApiErr] = useState<string | undefined>();
  const [serverErr, setServerErr] = useState<Errors>({});

  const [sheet, setSheet] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarErr, setAvatarErr] = useState<string | undefined>();

  /* ── animations ── */
  const enter = useRef(new Animated.Value(0)).current;
  const prog = useRef(new Animated.Value(0)).current;

  /* ── load ── */
  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr(undefined);
    try {
      const u = await userApi.getProfile();
      setProfile(u);
      setForm(toForm(u));
    } catch (e: any) {
      setLoadErr(apiErrorMessage(e, "Could not load your profile"));
    } finally {
      setLoading(false);
    }
  }, []);

  // Tabs me screen mounted rehti hai, isliye har focus par reset + reload
  useFocusEffect(
    useCallback(() => {
      setTried(false);
      setSaving(false);
      setSaved(false);
      setApiErr(undefined);
      setServerErr({});
      setAvatarErr(undefined);
      load();
    }, [load]),
  );

  /* ── derived ── */
  const errors = useMemo(() => validate(form), [form]);
  const hasErrors = Object.keys(errors).length > 0;
  const base = useMemo(() => toForm(profile), [profile]);
  const changed = KEYS.filter((k) => form[k].trim() !== base[k]);
  const dirty = changed.length > 0;
  const completion = useMemo(
    () => getCompletion(form, profile),
    [form, profile],
  );

  // entrance animation (content aate hi halka slide-up + fade)
  useEffect(() => {
    if (loading) {
      enter.setValue(0);
      return;
    }
    Animated.timing(enter, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [loading, enter]);

  // progress bar animation
  useEffect(() => {
    Animated.timing(prog, {
      toValue: completion.percent,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [completion.percent, prog]);

  const shown = (k: FieldKey) =>
    serverErr[k] ?? (tried ? errors[k] : undefined);

  const set = (k: FieldKey) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setApiErr(undefined);
    setServerErr((e) => ({ ...e, [k]: undefined }));
  };

  /* ── save: PATCH /users/profile ── */
  const submit = async () => {
    if (saving) return;
    Keyboard.dismiss();
    setTried(true);
    setApiErr(undefined);
    if (hasErrors) return;

    // Kuch change nahi hua to bhi poora form bhejo (button hamesha active hai)
    const keys = dirty ? changed : KEYS;
    const payload: Partial<Form> = {};
    keys.forEach((k) => {
      payload[k] = form[k].trim(); // "" = field hata do
    });

    setSaving(true);
    try {
      const u = await userApi.updateProfile(payload);

      // Server se fresh data lo, taaki UI me wahi dikhe jo actually save hua
      const fresh = await userApi.getProfile().catch(() => null);
      const merged = (fresh ?? {
        ...(profile as UserProfile),
        ...payload,
        ...(u ?? {}),
      }) as UserProfile;

      setProfile(merged);
      setForm(toForm(merged));
      setSaved(true);
    } catch (e: any) {
      if (e?.response?.status === 409) {
        setServerErr((s) => ({
          ...s,
          username: apiErrorMessage(e, "Username already taken"),
        }));
      } else {
        setApiErr(apiErrorMessage(e, "Could not save changes"));
      }
    } finally {
      setSaving(false);
    }
  };

  /* ── avatar ── */
  const refreshProfile = async () => {
    const u = await userApi.getProfile();
    setProfile(u);
  };

  const pickAvatar = () => {
    setSheet(false);
    // iOS: sheet band hone ke baad picker kholo
    setTimeout(async () => {
      setAvatarErr(undefined);
      try {
        const res = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        const uri = res.assets?.[0]?.uri;
        if (res.canceled || !uri) return;

        setAvatarBusy(true);
        await userApi.uploadAvatar(uri); // PATCH /users/profile/avatar
        await refreshProfile();
      } catch (e: any) {
        setAvatarErr(apiErrorMessage(e, "Could not update photo"));
      } finally {
        setAvatarBusy(false);
      }
    }, 350);
  };

  const removeAvatar = async () => {
    setSheet(false);
    setAvatarErr(undefined);
    setAvatarBusy(true);
    try {
      await userApi.removeAvatar(); // DELETE /users/profile/avatar
      await refreshProfile();
    } catch (e: any) {
      setAvatarErr(apiErrorMessage(e, "Could not remove photo"));
    } finally {
      setAvatarBusy(false);
    }
  };

  const avatarUrl = profile?.avatar?.url;
  const displayName = form.fullName.trim() || profile?.fullName || "?";
  const joined = joinedLabel(profile?.createdAt);
  const missingText = completion.missing.slice(0, 4).join(", ");
  const missingMore = completion.missing.length - 4;
  const bioPct = Math.min(100, Math.round((form.bio.length / BIO_MAX) * 100));
  const bioNearLimit = form.bio.length >= BIO_MAX * 0.9;

  /* ── UI ── */
  return (
    <Page
      icon="person-outline"
      title="Edit profile"
      subtitle="How others see you"
      footer={
        <View style={st.footerRow}>
          <ActionButton
            label="Cancel"
            variant="ghost"
            flex={1}
            disabled={saving}
            onPress={() => router.back()}
          />
          <ActionButton
            label={saving ? "Saving..." : "Save changes"}
            variant="primary"
            icon="checkmark"
            flex={1.4}
            loading={saving}
            disabled={loading || !!loadErr}
            onPress={submit}
          />
        </View>
      }
    >
      {loading ? (
        <View style={st.center}>
          <ActivityIndicator />
        </View>
      ) : loadErr ? (
        <View style={st.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={32}
            color={colors.muted}
          />
          <Text style={st.error}>{loadErr}</Text>
          <ActionButton label="Try again" variant="ghost" onPress={load} />
        </View>
      ) : (
        <Animated.View
          style={[
            st.stack,
            {
              opacity: enter,
              transform: [
                {
                  translateY: enter.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* ── Hero: avatar seedha page par ── */}
          <View style={st.hero}>
            <View style={st.avatarStage}>
              {SHOW_HALO ? (
                <>
                  <View style={st.haloOuter} />
                  <View style={st.haloInner} />
                </>
              ) : null}

              <Pressable
                onPress={() => setSheet(true)}
                disabled={avatarBusy}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
                style={({ pressed }) => [
                  st.avatarBox,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={st.avatarImg} />
                ) : (
                  <Avatar name={displayName} tint={BASE} size={AVATAR} />
                )}

                {avatarBusy ? (
                  <View style={st.avatarBusy}>
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                ) : (
                  <View style={st.camera}>
                    <Ionicons name="camera" size={14} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            </View>

            <Text style={st.sumName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={st.sumUser} numberOfLines={1}>
              {profile?.username ? `@${profile.username}` : "No username yet"}
            </Text>

            <View style={st.linkRow}>
              <Pressable
                onPress={() => setSheet(true)}
                disabled={avatarBusy}
                accessibilityRole="button"
                style={st.link}
              >
                <Text style={st.linkText}>Change photo</Text>
              </Pressable>
              {avatarUrl ? (
                <Pressable
                  onPress={removeAvatar}
                  disabled={avatarBusy}
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                  style={st.link}
                >
                  <Text style={[st.linkText, st.linkDanger]}>Remove</Text>
                </Pressable>
              ) : null}
            </View>

            {dirty ? (
              <View style={st.dirtyRow}>
                <View style={st.dirtyDot} />
                <Text style={st.dirtyText}>Unsaved changes</Text>
              </View>
            ) : null}

            {avatarErr ? (
              <Text style={[st.error, { marginTop: 10 }]}>{avatarErr}</Text>
            ) : null}
          </View>

          {/* ── Slim completion ── */}
          <View style={st.slim}>
            <View style={st.slimHead}>
              <Text style={st.slimTitle}>
                {completion.percent === 100
                  ? "Profile complete"
                  : "Profile strength"}
              </Text>
              <Text style={st.slimPct}>{completion.percent}%</Text>
            </View>
            <View style={st.track}>
              <Animated.View
                style={[
                  st.fill,
                  {
                    width: prog.interpolate({
                      inputRange: [0, 100],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
            {completion.missing.length ? (
              <Text style={st.slimHint}>
                Add: {missingText}
                {missingMore > 0 ? ` +${missingMore} more` : ""}
              </Text>
            ) : null}
          </View>

          {/* ── Basic details ── */}
          <View style={st.section}>
            <SectionTitle title="Basic details" icon="person-outline" />
            <View style={st.group}>
              <Row
                label="Name"
                value={form.fullName}
                onChangeText={set("fullName")}
                error={shown("fullName")}
                maxLength={40}
                editable={!saving}
                placeholder="Your name"
              />
              <Row
                label="Username"
                value={form.username}
                onChangeText={set("username")}
                error={shown("username")}
                hint="3–20 letters, numbers, . or _"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
                editable={!saving}
                placeholder="Not added"
              />
              <Row
                label="Birthday"
                value={form.dob}
                onChangeText={(t) => set("dob")(maskDob(t))}
                error={shown("dob")}
                hint="Format: YYYY-MM-DD"
                keyboardType="number-pad"
                maxLength={10}
                editable={!saving}
                placeholder="YYYY-MM-DD"
              />

              {/* Gender: label left, segmented right */}
              <View style={[st.row, st.rowCenter]}>
                <View style={st.labelCol}>
                  <Text style={st.label}>Gender</Text>
                </View>
                <View style={st.seg}>
                  {GENDERS.map((g) => {
                    const active = form.gender === g;
                    return (
                      <Pressable
                        key={g}
                        disabled={saving}
                        // dubara tap karne par hat jayega
                        onPress={() => set("gender")(active ? "" : g)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                        style={[st.segItem, active && st.segItemActive]}
                      >
                        <Text style={[st.segText, active && st.segTextActive]}>
                          {g}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          {/* ── Contact ── */}
          <View style={st.section}>
            <SectionTitle title="Contact" icon="mail-outline" />
            <View style={st.group}>
              <Row
                label="Email"
                verified
                value={profile?.email ?? ""}
                editable={false}
                hint="Your email is verified and can't be changed here."
              />
              <Row
                label="Phone"
                last
                value={form.phone}
                onChangeText={set("phone")}
                error={shown("phone")}
                keyboardType="phone-pad"
                editable={!saving}
                placeholder="Not added"
              />
            </View>
          </View>

          {/* ── Find me online ── */}
          <View style={st.section}>
            <SectionTitle title="Find me online" icon="globe-outline" />
            <View style={st.group}>
              <Row
                label="Location"
                value={form.location}
                onChangeText={set("location")}
                editable={!saving}
                placeholder="Not added"
              />
              <Row
                label="Website"
                last
                value={form.website}
                onChangeText={set("website")}
                error={shown("website")}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
                placeholder="https://example.com"
              />
            </View>
          </View>

          {/* ── About ── */}
          <View style={st.section}>
            <SectionTitle title="About" icon="document-text-outline" />
            <View style={st.group}>
              <View style={st.bioWrap}>
                <TextInput
                  value={form.bio}
                  onChangeText={(t) => set("bio")(t.slice(0, BIO_MAX))}
                  multiline
                  editable={!saving}
                  selectionColor={colors.primary}
                  placeholder="A short line about you"
                  placeholderTextColor={alpha(colors.muted, 0.6)}
                  accessibilityLabel="Bio"
                  style={st.bioInput}
                />
                <View style={st.bioFoot}>
                  <View style={st.bioTrack}>
                    <View
                      style={[
                        st.bioFill,
                        {
                          width: `${bioPct}%`,
                          backgroundColor: bioNearLimit
                            ? colors.error
                            : colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={st.bioCount}>
                    {form.bio.length}/{BIO_MAX}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {apiErr ? <Text style={st.error}>{apiErr}</Text> : null}

          <Text style={st.note}>
            {joined ? `${joined} · ` : ""}
            Clear an optional field and save to remove it.
          </Text>
        </Animated.View>
      )}

      {/* Photo options */}
      <ActionSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title="Profile photo"
        subtitle="Choose how to update it"
        avatar={<Avatar name={displayName} tint={BASE} size={42} />}
      >
        <SheetAction
          icon="image"
          label="Choose from gallery"
          onPress={pickAvatar}
        />
        {avatarUrl ? (
          <SheetAction
            icon="trash"
            label="Remove photo"
            danger
            onPress={removeAvatar}
          />
        ) : null}
        <SheetAction
          icon="close"
          label="Cancel"
          onPress={() => setSheet(false)}
        />
      </ActionSheet>

      {/* Saved */}
      <AppAlert
        visible={saved}
        type="success"
        title="Profile updated"
        message="Your changes have been saved."
        dismissible={false}
        buttons={[
          {
            text: "Done",
            variant: "primary",
            onPress: () => {
              setSaved(false);
              router.navigate("/settings" as never);
            },
          },
        ]}
        onClose={() => setSaved(false)}
      />
    </Page>
  );
}
