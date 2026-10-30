import React, { useCallback, useMemo, useState } from "react";
import { Alert, SectionList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActionSheet,
  Avatar,
  Badge,
  EmptyState,
  Fab,
  HeaderButton,
  ListRow,
  MUTED,
  PreviewText,
  RowMeta,
  Screen,
  ScreenTop,
  SearchBar,
  SectionHeader,
  Separator,
  SheetAction,
  StripItem,
  StripSection,
  TabPills,
  Tint,
  IconName,
  colors,
  listContentStyle,
  rowIconStyle,
  useReduceMotion,
  useScrolled,
} from "../components/ui";

type ChatType = "personal" | "group";

type Chat = {
  id: string;
  name: string;
  message: string;
  time: string;
  unread: number;
  type: ChatType;
  online?: boolean;
  muted?: boolean;
  pinned?: boolean;
  typing?: boolean;
  voice?: boolean;
  mine?: boolean;
  read?: boolean;
  tint: Tint;
  icon?: IconName;
};

const INITIAL_CHATS: Chat[] = [
  {
    id: "1",
    name: "Rohit Sharma",
    message: "See you soon! 👋",
    time: "2m",
    unread: 3,
    type: "personal",
    online: true,
    pinned: true,
    tint: ["#FFE8D6", "#C2410C"],
  },
  {
    id: "2",
    name: "Family Group",
    message: "Mom: Dinner is ready",
    time: "10m",
    unread: 0,
    type: "group",
    pinned: true,
    icon: "home",
    tint: ["#DBEAFE", "#1D4ED8"],
  },
  {
    id: "3",
    name: "Work Team",
    message: "Rahul: Meeting at 5 PM",
    time: "24m",
    unread: 0,
    type: "group",
    icon: "briefcase",
    tint: ["#EDE9FE", "#6D28D9"],
  },
  {
    id: "7",
    name: "Neha Verma",
    message: "typing…",
    time: "Now",
    unread: 0,
    type: "personal",
    online: true,
    typing: true,
    tint: ["#CFFAFE", "#0E7490"],
  },
  {
    id: "4",
    name: "Priya Singh",
    message: "Voice message",
    time: "1h",
    unread: 0,
    type: "personal",
    online: true,
    voice: true,
    tint: ["#FCE7F3", "#BE185D"],
  },
  {
    id: "5",
    name: "Study Group",
    message: "Great notes!",
    time: "2h",
    unread: 0,
    type: "group",
    mine: true,
    read: true,
    icon: "book",
    tint: ["#D1FAE5", "#047857"],
  },
  {
    id: "6",
    name: "Amit Kumar",
    message: "Ok, Thank you",
    time: "3h",
    unread: 0,
    type: "personal",
    muted: true,
    tint: ["#FEF3C7", "#B45309"],
  },
];

const TABS = ["All", "Personal", "Groups", "Unread"] as const;
type Tab = (typeof TABS)[number];

export default function Chats() {
  const router = useRouter();
  const go = useCallback(
    (path: string) => router.push(path as never),
    [router],
  );

  const reduceMotion = useReduceMotion();
  const { scrolled, onScroll } = useScrolled();

  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [tab, setTab] = useState<Tab>("All");
  const [query, setQuery] = useState("");
  const [sheetId, setSheetId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<Chat>) =>
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const unreadCount = chats.filter((c) => c.unread > 0).length;
  const totalUnread = chats.reduce((n, c) => n + c.unread, 0);
  const sheetChat = chats.find((c) => c.id === sheetId) ?? null;
  const q = query.trim().toLowerCase();

  const sections = useMemo(() => {
    const filtered = chats.filter((c) => {
      if (tab === "Personal" && c.type !== "personal") return false;
      if (tab === "Groups" && c.type !== "group") return false;
      if (tab === "Unread" && c.unread === 0) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) || c.message.toLowerCase().includes(q)
      );
    });
    const pinned = filtered.filter((c) => c.pinned);
    const rest = filtered.filter((c) => !c.pinned);
    const out: { title: string; data: Chat[] }[] = [];
    if (pinned.length) out.push({ title: "Pinned", data: pinned });
    if (rest.length) out.push({ title: "Messages", data: rest });
    return out;
  }, [chats, tab, q]);

  const activePeople = useMemo(
    () => chats.filter((c) => c.online && c.type === "personal"),
    [chats],
  );

  const confirmDelete = (chat: Chat) => {
    setSheetId(null);
    Alert.alert(
      "Delete chat?",
      `Your conversation with ${chat.name} will be removed from this device.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            setChats((prev) => prev.filter((c) => c.id !== chat.id)),
        },
      ],
    );
  };

  const close = () => setSheetId(null);

  return (
    <Screen>
      <ScreenTop
        title="Chats"
        subtitle={
          totalUnread > 0
            ? `${totalUnread} unread messages`
            : "You're all caught up"
        }
        scrolled={scrolled}
        actions={
          <>
            <HeaderButton
              icon="people-outline"
              label="New group"
              onPress={() => go("/new-group")}
            />
            <HeaderButton
              icon="notifications-outline"
              label="Notifications"
              onPress={() => go("/notifications")}
              dot={totalUnread > 0}
            />
          </>
        }
      >
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search or start new chat"
          label="Search chats"
        />
        <TabPills
          tabs={TABS}
          active={tab}
          onChange={setTab}
          badges={{ Unread: unreadCount }}
        />
      </ScreenTop>

      <SectionList
        sections={sections}
        keyExtractor={(c) => c.id}
        stickySectionHeadersEnabled={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listContentStyle}
        ListHeaderComponent={
          !q && tab === "All" && activePeople.length > 0 ? (
            <StripSection title="Active now">
              {activePeople.map((p) => (
                <StripItem
                  key={p.id}
                  label={p.name.split(" ")[0]}
                  accessibilityLabel={`${p.name}, online`}
                  onPress={() => go(`/chat/${p.id}`)}
                  avatar={
                    <Avatar
                      name={p.name}
                      icon={p.icon}
                      tint={p.tint}
                      size={46}
                      online
                    />
                  }
                />
              ))}
            </StripSection>
          ) : undefined
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} count={section.data.length} />
        )}
        renderItem={({ item, index }) => {
          const unread = item.unread > 0;
          return (
            <ListRow
              index={index}
              reduceMotion={reduceMotion}
              avatar={
                <Avatar
                  name={item.name}
                  icon={item.icon}
                  tint={item.tint}
                  online={item.online}
                />
              }
              title={item.name}
              titleStrong={unread}
              time={item.time}
              timeStrong={unread}
              onPress={() => go(`/chat/${item.id}`)}
              onLongPress={() => setSheetId(item.id)}
              accessibilityHint="Long press for more options"
              accessibilityLabel={`${item.name}. ${item.message}. ${item.time}${
                unread ? `. ${item.unread} unread` : ""
              }`}
            >
              {item.mine && (
                <Ionicons
                  name="checkmark-done"
                  size={15}
                  color={item.read ? colors.primary : MUTED}
                  style={rowIconStyle}
                />
              )}
              {item.voice && (
                <Ionicons
                  name="mic"
                  size={13}
                  color={colors.primary}
                  style={rowIconStyle}
                />
              )}
              <PreviewText strong={unread} accent={item.typing}>
                {item.message}
              </PreviewText>
              <RowMeta>
                {item.pinned && !unread && (
                  <Ionicons name="pin" size={12} color={MUTED} />
                )}
                {item.muted && (
                  <Ionicons name="notifications-off" size={13} color={MUTED} />
                )}
                {unread && <Badge count={item.unread} muted={item.muted} />}
              </RowMeta>
            </ListRow>
          );
        }}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <EmptyState
            icon={q ? "search" : "chatbubbles-outline"}
            title={q ? `No results for “${query.trim()}”` : "No chats here"}
            subtitle={
              q
                ? "Check the spelling or try a different name."
                : "Start a conversation and it will show up here."
            }
          />
        }
      />

      <Fab
        icon="create-outline"
        label="Start new chat"
        onPress={() => go("/new-chat")}
      />

      <ActionSheet
        visible={!!sheetChat}
        onClose={close}
        title={sheetChat?.name}
        subtitle={
          sheetChat
            ? sheetChat.type === "group"
              ? "Group"
              : sheetChat.online
                ? "Online"
                : "Offline"
            : undefined
        }
        avatar={
          sheetChat && (
            <Avatar
              name={sheetChat.name}
              icon={sheetChat.icon}
              tint={sheetChat.tint}
              size={42}
              online={sheetChat.online}
            />
          )
        }
      >
        {sheetChat && (
          <>
            <SheetAction
              icon={sheetChat.pinned ? "pin-outline" : "pin"}
              label={sheetChat.pinned ? "Unpin chat" : "Pin chat"}
              onPress={() => {
                update(sheetChat.id, { pinned: !sheetChat.pinned });
                close();
              }}
            />
            <SheetAction
              icon={sheetChat.muted ? "notifications" : "notifications-off"}
              label={
                sheetChat.muted ? "Unmute notifications" : "Mute notifications"
              }
              onPress={() => {
                update(sheetChat.id, { muted: !sheetChat.muted });
                close();
              }}
            />
            <SheetAction
              icon={sheetChat.unread > 0 ? "checkmark-done" : "mail-unread"}
              label={sheetChat.unread > 0 ? "Mark as read" : "Mark as unread"}
              onPress={() => {
                update(sheetChat.id, { unread: sheetChat.unread > 0 ? 0 : 1 });
                close();
              }}
            />
            <SheetAction
              icon="trash"
              label="Delete chat"
              onPress={() => confirmDelete(sheetChat)}
              danger
            />
          </>
        )}
      </ActionSheet>
    </Screen>
  );
}
