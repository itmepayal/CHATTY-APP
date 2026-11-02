import React, { useCallback, useMemo, useState } from "react";
import { Pressable, SectionList, Switch, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActionSheet,
  Avatar,
  EmptyState,
  IconName,
  SheetAction,
  Text,
  Tint,
  fonts,
  listContentStyle,
  space,
  usePalette,
} from "../components/ui";
import { alpha, makeUseStyles, useTheme } from "../theme/theme";
import { SettingsHeader } from "../components/settings/SettingHeader";

type Group = "Account" | "Preferences" | "Support";

type SettingItem = {
  id: string;
  label: string;
  short?: string;
  sub: string;
  value?: string;
  group: Group;
  icon: IconName;
  quick?: boolean;
  tint: Tint;
  route?: string;
  toggle?: boolean;
  keywords: string;
};

const PROFILE = {
  name: "Payal Yadav",
  email: "payal@example.com",
  tint: ["#FFE8D6", "#C2410C"] as Tint,
};

const ITEMS: SettingItem[] = [
  {
    id: "account",
    label: "Account & Security",
    short: "Security",
    sub: "Password, two-factor, devices",
    value: "2FA on",
    group: "Account",
    icon: "shield-checkmark-outline",
    quick: true,
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
    quick: true,
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
    short: "Alerts",
    sub: "Messages, groups, calls",
    group: "Preferences",
    icon: "notifications-outline",
    quick: true,
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
    short: "Theme",
    sub: "Theme, text size, bubble style",
    value: "Light",
    group: "Preferences",
    icon: "color-palette-outline",
    quick: true,
    tint: ["#FCE7F3", "#BE185D"],
    route: "/settings/appearance",
    keywords: "theme dark mode light font size bubble spacing",
  },
  {
    id: "chat",
    label: "Chat Settings",
    sub: "Enter key, downloads, disappearing",
    group: "Preferences",
    icon: "chatbubble-ellipses-outline",
    tint: ["#D1FAE5", "#047857"],
    route: "/settings/chat-settings",
    keywords: "disappearing messages archived link preview enter",
  },
  {
    id: "help",
    label: "Help & Support",
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

const ICON_BOX = 38;
const ROW_PAD = 14;
const DIVIDER_INSET = ROW_PAD + ICON_BOX + 12;

const useLocalStyles = makeUseStyles((t) => ({
  /* Profile */
  profile: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: space.screen,
    marginTop: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
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
    letterSpacing: -0.1,
    color: t.colors.ink,
    includeFontPadding: false,
  },
  profileEmail: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: t.colors.muted,
    includeFontPadding: false,
  },
  editPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: alpha(t.colors.primary, 0.1),
  },
  editText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 16,
    color: t.colors.primary,
    includeFontPadding: false,
  },

  /* Quick access */
  quickWrap: { marginTop: 8, paddingHorizontal: space.screen },
  quickGrid: { flexDirection: "row", gap: 10 },
  tile: {
    flex: 1,
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 4,
    borderRadius: 18,
    backgroundColor: t.colors.card,
    borderWidth: 1,
    borderColor: t.colors.hairline,
  },
  tilePressed: { backgroundColor: alpha(t.colors.primary, 0.06) },
  tileIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.1,
    color: alpha(t.colors.ink, 0.85),
    marginTop: 9,
    textAlign: "center",
    includeFontPadding: false,
  },

  /* Section label */
  sectionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    lineHeight: 15,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: t.colors.muted,
    paddingHorizontal: space.screen + 6,
    paddingTop: 22,
    paddingBottom: 8,
    includeFontPadding: false,
  },

  /* Grouped card rows */
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: space.screen,
    paddingVertical: 11,
    paddingHorizontal: ROW_PAD,
    minHeight: 64,
    backgroundColor: t.colors.card,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: t.colors.hairline,
  },
  rowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  rowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  rowPressed: { backgroundColor: alpha(t.colors.primary, 0.05) },
  divider: {
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
    fontSize: 13.5,
    lineHeight: 19,
    letterSpacing: -0.1,
    color: t.colors.ink,
    includeFontPadding: false,
  },
  rowSub: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: t.colors.muted,
    includeFontPadding: false,
  },
  rowRight: { flexDirection: "row", alignItems: "center", marginLeft: 8 },
  valueText: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: t.colors.muted,
    marginRight: 4,
    includeFontPadding: false,
  },
  sectionGap: { height: 2 },

  /* Footer */
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: space.screen,
    marginTop: 26,
    paddingHorizontal: ROW_PAD,
    height: 56,
    borderRadius: 18,
    backgroundColor: t.colors.card,
    borderWidth: 1,
    borderColor: t.colors.hairline,
  },
  logoutPressed: { backgroundColor: alpha(t.colors.error, 0.06) },
  logoutIcon: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: 12,
    backgroundColor: alpha(t.colors.error, 0.1),
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.error,
    marginLeft: 12,
    includeFontPadding: false,
  },
  version: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: t.colors.muted,
    textAlign: "center",
    marginTop: 18,
    marginBottom: 8,
    includeFontPadding: false,
  },
}));

function ProfileCard({ onPress }: { onPress: () => void }) {
  const local = useLocalStyles();
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${PROFILE.name}. ${PROFILE.email}. Edit profile`}
      style={({ pressed }) => [local.profile, pressed && local.profilePressed]}
    >
      <Avatar name={PROFILE.name} tint={PROFILE.tint} size={54} online />
      <View style={local.profileBody}>
        <Text style={local.profileName} numberOfLines={1}>
          {PROFILE.name}
        </Text>
        <Text style={local.profileEmail} numberOfLines={1}>
          {PROFILE.email}
        </Text>
      </View>
      <View style={local.editPill}>
        <Ionicons name="create-outline" size={14} color={p.primary} />
        <Text style={local.editText}>Edit</Text>
      </View>
    </Pressable>
  );
}

function QuickAccess({
  items,
  onOpen,
}: {
  items: SettingItem[];
  onOpen: (path: string) => void;
}) {
  const local = useLocalStyles();
  return (
    <View>
      <Text style={local.sectionLabel}>Quick access</Text>
      <View style={local.quickWrap}>
        <View style={local.quickGrid}>
          {items.map((i) => (
            <Pressable
              key={i.id}
              onPress={() => i.route && onOpen(i.route)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${i.label}`}
              style={({ pressed }) => [
                local.tile,
                pressed && local.tilePressed,
              ]}
            >
              <View style={[local.tileIcon, { backgroundColor: i.tint[0] }]}>
                <Ionicons name={i.icon} size={20} color={i.tint[1]} />
              </View>
              <Text style={local.tileLabel} numberOfLines={1}>
                {i.short ?? i.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

type RowProps = {
  item: SettingItem;
  first: boolean;
  last: boolean;
  on: boolean;
  onOpen: (path: string) => void;
  onToggle: (id: string, v: boolean) => void;
};

function SettingRow({ item, first, last, on, onOpen, onToggle }: RowProps) {
  const local = useLocalStyles();
  const p = usePalette();
  const { colors } = useTheme();

  const rowStyle = (pressed: boolean) => [
    local.row,
    first && local.rowFirst,
    last && local.rowLast,
    pressed && local.rowPressed,
  ];

  const body = (
    <>
      <View style={[local.iconBox, { backgroundColor: item.tint[0] }]}>
        <Ionicons name={item.icon} size={18} color={item.tint[1]} />
      </View>
      <View style={local.rowBody}>
        <Text style={local.rowTitle} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={local.rowSub} numberOfLines={1}>
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
        style={({ pressed }) => rowStyle(pressed)}
      >
        {body}
        <View style={local.rowRight}>
          <Switch
            value={on}
            onValueChange={(v) => onToggle(item.id, v)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
        {!last && <View style={local.divider} />}
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
      style={({ pressed }) => rowStyle(pressed)}
    >
      {body}
      <View style={local.rowRight}>
        {item.value ? <Text style={local.valueText}>{item.value}</Text> : null}
        <Ionicons name="chevron-forward" size={16} color={p.muted} />
      </View>
      {!last && <View style={local.divider} />}
    </Pressable>
  );
}

export default function Settings() {
  const router = useRouter();
  const p = usePalette();
  const local = useLocalStyles();
  const { name: themeName } = useTheme();

  const go = useCallback(
    (path: string) => router.push(path as never),
    [router],
  );

  const [tab, setTab] = useState<Tab>("All");
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [flags, setFlags] = useState<Record<string, boolean>>({
    push: true,
    receipts: true,
  });
  const q = query.trim().toLowerCase();

  const setFlag = useCallback(
    (id: string, v: boolean) => setFlags((f) => ({ ...f, [id]: v })),
    [],
  );

  const items = useMemo<SettingItem[]>(
    () =>
      ITEMS.map((i) =>
        i.id === "appearance" ? { ...i, value: prettyName(themeName) } : i,
      ),
    [themeName],
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
    })).filter((sec) => sec.data.length > 0);
  }, [items, q, tab]);

  const quick = useMemo(() => items.filter((i) => i.quick), [items]);
  const showHeader = !q && tab === "All";

  const logout = () => {
    setSheetOpen(false);
    router.replace("/auth/login" as never);
  };

  const logoutAll = () => {
    setSheetOpen(false);
    go("/settings/sessions");
  };

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
        onLogout={() => setSheetOpen(true)}
        onBell={() => go("/notifications")}
        bellDot
      />

      <SectionList
        sections={sections}
        keyExtractor={(i) => i.id}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listContentStyle}
        ListHeaderComponent={
          showHeader ? (
            <>
              <ProfileCard onPress={() => go("/settings/profile")} />
              <QuickAccess items={quick} onOpen={go} />
            </>
          ) : undefined
        }
        renderSectionHeader={({ section }) => (
          <Text style={local.sectionLabel}>{section.title}</Text>
        )}
        renderItem={({ item, index, section }) => (
          <SettingRow
            item={item}
            first={index === 0}
            last={index === section.data.length - 1}
            on={!!flags[item.id]}
            onOpen={go}
            onToggle={setFlag}
          />
        )}
        renderSectionFooter={() => <View style={local.sectionGap} />}
        ListEmptyComponent={
          <EmptyState
            icon={q ? "search" : "settings-outline"}
            title={q ? `No results for “${query.trim()}”` : "Nothing here"}
            subtitle={
              q
                ? "Check the spelling or try a different word."
                : "No settings in this section yet."
            }
          />
        }
        ListFooterComponent={
          showHeader ? (
            <>
              <Pressable
                onPress={() => setSheetOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Log out"
                style={({ pressed }) => [
                  local.logoutRow,
                  pressed && local.logoutPressed,
                ]}
              >
                <View style={local.logoutIcon}>
                  <Ionicons name="log-out-outline" size={18} color={p.danger} />
                </View>
                <Text style={local.logoutText}>Log out</Text>
                <Ionicons name="chevron-forward" size={16} color={p.danger} />
              </Pressable>
              <Text style={local.version}>Chatty v1.0.0</Text>
            </>
          ) : undefined
        }
      />

      <ActionSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={PROFILE.name}
        subtitle={PROFILE.email}
        avatar={
          <Avatar name={PROFILE.name} tint={PROFILE.tint} size={42} online />
        }
      >
        <SheetAction
          icon="log-out"
          label="Log out from this device"
          onPress={logout}
          danger
        />
        <SheetAction
          icon="phone-portrait"
          label="Manage other devices"
          onPress={logoutAll}
          danger
        />
        <SheetAction
          icon="close"
          label="Cancel"
          onPress={() => setSheetOpen(false)}
        />
      </ActionSheet>
    </View>
  );
}
