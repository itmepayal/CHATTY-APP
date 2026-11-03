import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  DimensionValue,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleProp,
  Switch,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Avatar,
  EmptyState,
  IconName,
  Text,
  Tint,
  fonts,
  listContentStyle,
  space,
  usePalette,
} from "../components/ui";
import { alpha, makeUseStyles, useTheme } from "../theme/theme";
import { SettingsHeader } from "../components/settings/SettingHeader";
import { userApi, UserProfile } from "../lib/api/user.api";

/* ───────────────────────── Data ───────────────────────── */

type Group = "Account" | "Preferences" | "Support";

type SettingItem = {
  id: string;
  label: string;
  sub: string;
  value?: string;
  valueLoading?: boolean;
  group: Group;
  icon: IconName;
  tint: Tint;
  route?: string;
  toggle?: boolean;
  keywords: string;
};

// Avatar ka default rang (photo na ho to)
const PROFILE_TINT: Tint = ["#FFE8D6", "#C2410C"];

// Profile ek baar aa gayi to dobara screen kholne par skeleton na dikhe
let cachedProfile: UserProfile | null = null;

const ITEMS: SettingItem[] = [
  {
    id: "account",
    label: "Account & Security",
    sub: "Password, two-factor, devices",
    group: "Account",
    icon: "shield-checkmark-outline",
    tint: ["#EDE9FE", "#6D28D9"],
    route: "/settings/security",
    keywords: "password passkey 2fa two factor login devices sessions delete",
  },
  {
    id: "privacy",
    label: "Privacy",
    sub: "Last seen, profile photo, blocked",
    group: "Account",
    icon: "lock-closed-outline",
    tint: ["#DBEAFE", "#1D4ED8"],
    route: "/settings/privacy",
    keywords: "last seen online profile photo block",
  },
  {
    id: "receipts",
    label: "Read receipts",
    sub: "Let others see when you've read",
    group: "Account",
    icon: "checkmark-done-outline",
    tint: ["#E0F2FE", "#0369A1"],
    toggle: true,
    keywords: "read receipts seen blue ticks",
  },
  {
    id: "notifications",
    label: "Notifications",
    sub: "Messages, groups, calls",
    group: "Preferences",
    icon: "notifications-outline",
    tint: ["#FEF3C7", "#B45309"],
    route: "/settings/notifications-settings",
    keywords: "alerts sound mute quiet hours do not disturb mention",
  },
  {
    id: "push",
    label: "Push notifications",
    sub: "Get alerts for new messages",
    group: "Preferences",
    icon: "megaphone-outline",
    tint: ["#FFEDD5", "#C2410C"],
    toggle: true,
    keywords: "push alerts banner",
  },
  {
    id: "appearance",
    label: "Appearance",
    sub: "Theme, text size, bubble style",
    value: "Light",
    group: "Preferences",
    icon: "color-palette-outline",
    tint: ["#FCE7F3", "#BE185D"],
    route: "/settings/appearance",
    keywords: "theme dark mode light font size bubble spacing",
  },
  {
    id: "chat",
    label: "Chat settings",
    sub: "Enter key, downloads, disappearing",
    group: "Preferences",
    icon: "chatbubble-ellipses-outline",
    tint: ["#D1FAE5", "#047857"],
    route: "/settings/chat-settings",
    keywords: "disappearing messages archived link preview enter",
  },
  {
    id: "help",
    label: "Help & support",
    sub: "FAQ, contact us, report a problem",
    group: "Support",
    icon: "help-circle-outline",
    tint: ["#FFE8D6", "#C2410C"],
    route: "/settings/help",
    keywords: "faq contact feedback report bug about version",
  },
];

const TABS = ["All", "Account", "Preferences", "Support"] as const;
type Tab = (typeof TABS)[number];
const GROUPS: Group[] = ["Account", "Preferences", "Support"];

const prettyName = (n: string) => n.charAt(0).toUpperCase() + n.slice(1);

/* ───────────────────────── Styles ───────────────────────── */

const ICON_BOX = 38;
const ROW_PAD = 14;
const DIVIDER_INSET = ROW_PAD + ICON_BOX + 12;
const PROFILE_AVATAR = 52;

const useStyles = makeUseStyles((t) => ({
  /* Profile */
  profile: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: space.screen,
    marginTop: 16,
    padding: 14,
    borderRadius: 20,
    backgroundColor: t.colors.card,
    borderWidth: 1,
    borderColor: t.colors.hairline,
  },
  profilePressed: { backgroundColor: alpha(t.colors.primary, 0.05) },
  profileBody: { flex: 1, minWidth: 0, marginLeft: 14 },
  profileName: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 21,
    color: t.colors.ink,
    includeFontPadding: false,
  },
  profileUser: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: t.colors.primary,
    includeFontPadding: false,
  },
  profileEmail: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: t.colors.muted,
    includeFontPadding: false,
  },
  avatarWrap: { width: PROFILE_AVATAR, height: PROFILE_AVATAR },
  avatarImg: {
    width: PROFILE_AVATAR,
    height: PROFILE_AVATAR,
    borderRadius: PROFILE_AVATAR / 2,
    backgroundColor: alpha(t.colors.muted, 0.15),
  },
  onlineDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: t.colors.card,
  },

  /* Skeleton (profile card jitni hi height, taaki layout jump na ho) */
  skelLines: { gap: 4 },
  skelChevron: { marginLeft: 8 },

  /* Section */
  sectionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: t.colors.muted,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: space.screen + 6,
    includeFontPadding: false,
  },
  card: {
    marginHorizontal: space.screen,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: t.colors.hairline,
    backgroundColor: t.colors.card,
    overflow: "hidden",
  },

  /* Row */
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    paddingVertical: 11,
    paddingHorizontal: ROW_PAD,
  },
  rowPressed: { backgroundColor: alpha(t.colors.primary, 0.05) },
  rowDivider: {
    position: "absolute",
    left: DIVIDER_INSET,
    right: ROW_PAD,
    bottom: 0,
    height: 1,
    backgroundColor: t.colors.hairline,
  },
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, minWidth: 0, marginLeft: 12 },
  rowTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 19,
    color: t.colors.ink,
    includeFontPadding: false,
  },
  rowSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.colors.muted,
    includeFontPadding: false,
  },
  rowRight: { flexDirection: "row", alignItems: "center", marginLeft: 8 },
  rowValue: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: t.colors.muted,
    marginRight: 4,
    includeFontPadding: false,
  },

  /* Logout + footer */
  logoutCard: { marginTop: 28 },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: ROW_PAD,
  },
  logoutPressed: { backgroundColor: alpha(t.colors.error, 0.06) },
  logoutIcon: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(t.colors.error, 0.1),
  },
  logoutText: {
    flex: 1,
    marginLeft: 12,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 19,
    color: t.colors.error,
    includeFontPadding: false,
  },
  version: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: t.colors.muted,
    textAlign: "center",
    marginTop: 18,
    marginBottom: 8,
    includeFontPadding: false,
  },
}));

/* ───────────────────────── Skeleton ───────────────────────── */

/** Ek soft pulse (opacity) wala bone. Sab bones same timing par chalte hain. */
function Bone({
  width,
  height,
  radius = 6,
  style,
}: {
  width: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: alpha(colors.muted, 0.18),
          opacity,
        },
        style,
      ]}
    />
  );
}

function ProfileSkeleton() {
  const st = useStyles();

  return (
    <View
      style={st.profile}
      accessible
      accessibilityLabel="Loading profile"
      accessibilityState={{ busy: true }}
    >
      <Bone
        width={PROFILE_AVATAR}
        height={PROFILE_AVATAR}
        radius={PROFILE_AVATAR / 2}
      />
      <View style={[st.profileBody, st.skelLines]}>
        {/* name (lineHeight 21) */}
        <Bone
          width="55%"
          height={15}
          radius={7}
          style={{ marginVertical: 3 }}
        />
        {/* username (lineHeight 17) */}
        <Bone
          width="32%"
          height={11}
          radius={6}
          style={{ marginVertical: 3 }}
        />
        {/* email (lineHeight 17) */}
        <Bone
          width="72%"
          height={11}
          radius={6}
          style={{ marginVertical: 3 }}
        />
      </View>
      <Bone width={18} height={18} radius={9} style={st.skelChevron} />
    </View>
  );
}

/* ───────────────────────── Pieces ───────────────────────── */

function ProfileCard({
  profile,
  onPress,
}: {
  profile: UserProfile | null;
  onPress: () => void;
}) {
  const st = useStyles();
  const p = usePalette();

  const name = profile?.fullName?.trim() || "Your profile";
  const username = profile?.username?.trim();
  const email = profile?.email || "Tap to edit your profile";
  const avatarUrl = profile?.avatar?.url;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${email}. Edit profile`}
      style={({ pressed }) => [st.profile, pressed && st.profilePressed]}
    >
      {avatarUrl ? (
        <View style={st.avatarWrap}>
          <Image source={{ uri: avatarUrl }} style={st.avatarImg} />
          <View style={st.onlineDot} />
        </View>
      ) : (
        <Avatar name={name} tint={PROFILE_TINT} size={PROFILE_AVATAR} online />
      )}

      <View style={st.profileBody}>
        <Text style={st.profileName} numberOfLines={1}>
          {name}
        </Text>
        {username ? (
          <Text style={st.profileUser} numberOfLines={1}>
            @{username}
          </Text>
        ) : null}
        <Text style={st.profileEmail} numberOfLines={1}>
          {email}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={p.muted} />
    </Pressable>
  );
}

type RowProps = {
  item: SettingItem;
  last: boolean;
  on: boolean;
  onOpen: (path: string) => void;
  onToggle: (id: string, v: boolean) => void;
};

function SettingRow({ item, last, on, onOpen, onToggle }: RowProps) {
  const st = useStyles();
  const p = usePalette();
  const { colors } = useTheme();

  const left = (
    <>
      <View style={[st.iconBox, { backgroundColor: item.tint[0] }]}>
        <Ionicons name={item.icon} size={18} color={item.tint[1]} />
      </View>
      <View style={st.rowBody}>
        <Text style={st.rowTitle} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={st.rowSub} numberOfLines={1}>
          {item.sub}
        </Text>
      </View>
    </>
  );

  if (item.toggle) {
    return (
      <Pressable
        onPress={() => onToggle(item.id, !on)}
        accessibilityRole="switch"
        accessibilityState={{ checked: on }}
        accessibilityLabel={`${item.label}. ${item.sub}`}
        style={({ pressed }) => [st.row, pressed && st.rowPressed]}
      >
        {left}
        <View style={st.rowRight}>
          <Switch
            value={on}
            onValueChange={(v) => onToggle(item.id, v)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
        {!last && <View style={st.rowDivider} />}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => item.route && onOpen(item.route)}
      accessibilityRole="button"
      accessibilityHint="Opens this setting"
      accessibilityLabel={`${item.label}. ${item.sub}${
        item.value ? `. ${item.value}` : ""
      }`}
      style={({ pressed }) => [st.row, pressed && st.rowPressed]}
    >
      {left}
      <View style={st.rowRight}>
        {item.valueLoading ? (
          <Bone width={42} height={12} radius={6} style={{ marginRight: 8 }} />
        ) : item.value ? (
          <Text style={st.rowValue}>{item.value}</Text>
        ) : null}
        <Ionicons name="chevron-forward" size={16} color={p.muted} />
      </View>
      {!last && <View style={st.rowDivider} />}
    </Pressable>
  );
}

/* ───────────────────────── Screen ───────────────────────── */

export default function Settings() {
  const router = useRouter();
  const p = usePalette();
  const st = useStyles();
  const { name: themeName } = useTheme();

  const go = useCallback(
    (path: string) => router.push(path as never),
    [router],
  );
  const openLogout = useCallback(() => go("/settings/logout"), [go]);

  const [tab, setTab] = useState<Tab>("All");
  const [query, setQuery] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({
    push: true,
    receipts: true,
  });

  /* ── user profile (asli data) ── */
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile);
  // Skeleton sirf tab jab cache bhi khali ho (pehli baar)
  const [profileLoading, setProfileLoading] = useState(!cachedProfile);

  // Tabs me screen mounted rehti hai, isliye har focus par naya data lo
  // (Edit profile se wapas aate hi naam/photo update dikhe)
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        try {
          const u = await userApi.getProfile();
          if (u) {
            cachedProfile = u;
            if (alive) setProfile(u);
          }
        } catch {
          // error par purana data hi dikhta rahe
        } finally {
          if (alive) setProfileLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const q = query.trim().toLowerCase();
  const showExtras = !q && tab === "All"; // profile + logout sirf default view me

  const setFlag = useCallback(
    (id: string, v: boolean) => setFlags((f) => ({ ...f, [id]: v })),
    [],
  );

  const items = useMemo<SettingItem[]>(
    () =>
      ITEMS.map((i) => {
        if (i.id === "appearance")
          return { ...i, value: prettyName(themeName) };
        if (i.id === "account") {
          // Profile aane tak 2FA badge ki jagah skeleton
          if (profileLoading && !profile) return { ...i, valueLoading: true };
          const tf = profile?.twoFactorEnabled;
          return {
            ...i,
            value:
              tf === true ? "2FA on" : tf === false ? "2FA off" : undefined,
          };
        }
        return i;
      }),
    [themeName, profile, profileLoading],
  );

  const sections = useMemo(() => {
    const filtered = items.filter((i) => {
      if (tab !== "All" && i.group !== tab) return false;
      if (!q) return true;
      return (
        i.label.toLowerCase().includes(q) ||
        i.sub.toLowerCase().includes(q) ||
        i.keywords.includes(q)
      );
    });

    return GROUPS.map((g) => ({
      title: g,
      data: filtered.filter((i) => i.group === g),
    })).filter((s) => s.data.length > 0);
  }, [items, q, tab]);

  const showSkeleton = profileLoading && !profile;

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <StatusBar style={p.onPrimary === "#FFFFFF" ? "light" : "dark"} />

      <SettingsHeader
        title="Settings"
        subtitle="Manage your account and app"
        query={query}
        onChangeQuery={setQuery}
        tabs={TABS}
        activeTab={tab}
        onChangeTab={setTab}
        onLogout={openLogout}
        onBell={() => go("/notifications")}
        bellDot
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={listContentStyle}
      >
        {showExtras &&
          (showSkeleton ? (
            <ProfileSkeleton />
          ) : (
            <ProfileCard
              profile={profile}
              onPress={() => go("/settings/profile")}
            />
          ))}

        {sections.length === 0 ? (
          <EmptyState
            icon={q ? "search" : "settings-outline"}
            title={q ? `No results for “${query.trim()}”` : "Nothing here"}
            subtitle={
              q
                ? "Check the spelling or try a different word."
                : "No settings in this section yet."
            }
          />
        ) : (
          sections.map((sec) => (
            <View key={sec.title}>
              <Text style={st.sectionLabel}>{sec.title}</Text>
              <View style={st.card}>
                {sec.data.map((item, i) => (
                  <SettingRow
                    key={item.id}
                    item={item}
                    last={i === sec.data.length - 1}
                    on={!!flags[item.id]}
                    onOpen={go}
                    onToggle={setFlag}
                  />
                ))}
              </View>
            </View>
          ))
        )}

        {showExtras && (
          <>
            <View style={[st.card, st.logoutCard]}>
              <Pressable
                onPress={openLogout}
                accessibilityRole="button"
                accessibilityLabel="Log out"
                style={({ pressed }) => [
                  st.logoutRow,
                  pressed && st.logoutPressed,
                ]}
              >
                <View style={st.logoutIcon}>
                  <Ionicons name="log-out-outline" size={18} color={p.danger} />
                </View>
                <Text style={st.logoutText}>Log out</Text>
                <Ionicons name="chevron-forward" size={16} color={p.danger} />
              </Pressable>
            </View>

            <Text style={st.version}>Chatty v1.0.0</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
