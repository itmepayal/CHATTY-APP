import React, { useCallback, useMemo, useState } from "react";
import { Pressable, SectionList, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActionSheet,
  Avatar,
  BG,
  DANGER,
  EmptyState,
  HeaderButton,
  IconName,
  LINE,
  ListRow,
  MUTED,
  PreviewText,
  RowMeta,
  SURFACE,
  Screen,
  ScreenTop,
  SearchBar,
  SectionHeader,
  Separator,
  SheetAction,
  StripItem,
  StripSection,
  TEXT,
  TabPills,
  Text,
  Tint,
  colors,
  fonts,
  listContentStyle,
  radius,
  space,
  useReduceMotion,
  useScrolled,
} from "../components/ui";

type Group = "Account" | "Preferences" | "Support";

type SettingItem = {
  id: string;
  label: string;
  sub: string;
  value?: string;
  group: Group;
  icon: IconName;
  quick?: boolean;
  tint: Tint;
  route: string;
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
    sub: "Last seen, read receipts, photo",
    group: "Account",
    icon: "lock-closed-outline",
    quick: true,
    tint: ["#DBEAFE", "#1D4ED8"],
    route: "/settings/privacy",
    keywords: "last seen online read receipts block profile photo",
  },
  {
    id: "notifications",
    label: "Notifications",
    sub: "Messages, groups, calls",
    value: "On",
    group: "Preferences",
    icon: "notifications-outline",
    quick: true,
    tint: ["#FEF3C7", "#B45309"],
    route: "/settings/notifications-settings",
    keywords: "alerts sound mute quiet hours do not disturb mention",
  },
  {
    id: "appearance",
    label: "Appearance",
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
    id: "data",
    label: "Data & Storage",
    sub: "Media, backup, usage",
    value: "1.2 GB",
    group: "Support",
    icon: "server-outline",
    tint: ["#CFFAFE", "#0E7490"],
    route: "/settings/data-storage",
    keywords: "storage cache backup download media network usage",
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

function ProfileCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${PROFILE.name}. ${PROFILE.email}. Edit profile`}
      style={({ pressed }) => [
        local.profile,
        pressed && { backgroundColor: LINE },
      ]}
    >
      <Avatar name={PROFILE.name} tint={PROFILE.tint} size={56} online />
      <View style={local.profileBody}>
        <Text style={local.profileName} numberOfLines={1}>
          {PROFILE.name}
        </Text>
        <Text style={local.profileEmail} numberOfLines={1}>
          {PROFILE.email}
        </Text>
      </View>
      <View style={local.editBtn}>
        <Ionicons name="create-outline" size={17} color={colors.primary} />
      </View>
    </Pressable>
  );
}

export default function Settings() {
  const router = useRouter();
  const go = useCallback(
    (path: string) => router.push(path as never),
    [router],
  );

  const reduceMotion = useReduceMotion();
  const { scrolled, onScroll } = useScrolled();

  const [tab, setTab] = useState<Tab>("All");
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const q = query.trim().toLowerCase();

  const sections = useMemo(() => {
    const filtered = ITEMS.filter((i) => {
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
  }, [q, tab]);

  const quick = useMemo(() => ITEMS.filter((i) => i.quick), []);
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
    <Screen>
      <ScreenTop
        title="Settings"
        subtitle="Manage your account and app"
        scrolled={scrolled}
        actions={
          <>
            <HeaderButton
              icon="log-out-outline"
              label="Log out"
              color={DANGER}
              onPress={() => setSheetOpen(true)}
            />
            <HeaderButton
              icon="notifications-outline"
              label="Notifications"
              onPress={() => go("/notifications")}
              dot
            />
          </>
        }
      >
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search settings"
          label="Search settings"
        />
        <TabPills tabs={TABS} active={tab} onChange={setTab} />
      </ScreenTop>

      <SectionList
        sections={sections}
        keyExtractor={(i) => i.id}
        stickySectionHeadersEnabled={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listContentStyle}
        ListHeaderComponent={
          showHeader ? (
            <>
              <ProfileCard onPress={() => go("/settings/profile")} />
              <StripSection title="Quick access">
                {quick.map((i) => (
                  <StripItem
                    key={i.id}
                    label={i.label.split(" ")[0]}
                    accessibilityLabel={`Open ${i.label}`}
                    onPress={() => go(i.route)}
                    avatar={<Avatar icon={i.icon} tint={i.tint} size={46} />}
                  />
                ))}
              </StripSection>
            </>
          ) : undefined
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} count={section.data.length} />
        )}
        renderItem={({ item, index }) => (
          <ListRow
            index={index}
            reduceMotion={reduceMotion}
            avatar={<Avatar icon={item.icon} tint={item.tint} />}
            title={item.label}
            time={item.value}
            onPress={() => go(item.route)}
            accessibilityHint="Opens this setting"
            accessibilityLabel={`${item.label}. ${item.sub}${item.value ? `. ${item.value}` : ""}`}
          >
            <PreviewText>{item.sub}</PreviewText>
            <RowMeta>
              <Ionicons name="chevron-forward" size={15} color={MUTED} />
            </RowMeta>
          </ListRow>
        )}
        ItemSeparatorComponent={Separator}
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
            <Text style={local.version}>Chatty v1.0.0</Text>
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
    </Screen>
  );
}

const local = StyleSheet.create({
  profile: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: space.screen,
    marginTop: 4,
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: SURFACE,
  },
  profileBody: { flex: 1, minWidth: 0, marginLeft: 12 },
  profileName: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
    includeFontPadding: false,
  },
  profileEmail: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
    includeFontPadding: false,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },
  version: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    lineHeight: 15,
    color: MUTED,
    textAlign: "center",
    marginTop: 32,
    includeFontPadding: false,
  },
});
