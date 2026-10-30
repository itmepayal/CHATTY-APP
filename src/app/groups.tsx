import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, SectionList, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActionSheet,
  Avatar,
  BottomSheet,
  Badge,
  Caption,
  CaptionLine,
  EmptyState,
  Fab,
  Field,
  FieldLabel,
  HeaderButton,
  IconName,
  ListRow,
  MUTED,
  ONLINE,
  PreviewText,
  PrimaryButton,
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
  Text,
  Tint,
  colors,
  fonts,
  listContentStyle,
  radius,
  rowIconStyle,
  useReduceMotion,
  useScrolled,
  TEXT,
  SURFACE,
} from "../components/ui";

type GroupCategory = "Work" | "Friends" | "Study";

type Group = {
  id: string;
  name: string;
  description: string;
  message: string;
  time: string;
  members: number;
  online: number;
  unread: number;
  category: GroupCategory;
  tint: Tint;
  icon: IconName;
  pinned?: boolean;
  muted?: boolean;
  typing?: boolean;
  mine?: boolean;
  read?: boolean;
};

const INITIAL_GROUPS: Group[] = [
  {
    id: "2",
    name: "Study Group",
    description: "DSA and interview preparation",
    message: "Priya: Let's solve today's problems! 🔥",
    time: "2m",
    members: 12,
    online: 5,
    unread: 4,
    category: "Study",
    tint: ["#EDE9FE", "#6D28D9"],
    icon: "school",
    pinned: true,
  },
  {
    id: "3",
    name: "Family Group",
    description: "Our family conversations ❤️",
    message: "Mom: Dinner is ready!",
    time: "10m",
    members: 9,
    online: 3,
    unread: 1,
    category: "Friends",
    tint: ["#FCE7F3", "#BE185D"],
    icon: "home",
  },
  {
    id: "4",
    name: "Work Team",
    description: "Project collaboration",
    message: "Rahul: Meeting at 5 PM",
    time: "24m",
    members: 8,
    online: 4,
    unread: 2,
    category: "Work",
    tint: ["#DBEAFE", "#1D4ED8"],
    icon: "briefcase",
    pinned: true,
  },
  {
    id: "5",
    name: "Frontend Developers",
    description: "React, React Native and UI",
    message: "Amit: Check out this new design 🚀",
    time: "35m",
    members: 46,
    online: 11,
    unread: 7,
    category: "Work",
    tint: ["#FEF3C7", "#B45309"],
    icon: "code-slash",
  },
  {
    id: "6",
    name: "Weekend Friends",
    description: "Plans, photos and memories",
    message: "Sneha: Where are we going?",
    time: "1h",
    members: 7,
    online: 2,
    unread: 0,
    category: "Friends",
    tint: ["#D1FAE5", "#047857"],
    icon: "people",
  },
  {
    id: "7",
    name: "Backend Engineers",
    description: "APIs, databases and architecture",
    message: "You: Shared the API documentation",
    time: "2h",
    members: 32,
    online: 8,
    unread: 0,
    category: "Work",
    tint: ["#CFFAFE", "#0E7490"],
    icon: "server",
    muted: true,
    mine: true,
    read: true,
  },
  {
    id: "8",
    name: "Project Alpha",
    description: "Building something great",
    message: "Karan: PR has been merged",
    time: "3h",
    members: 6,
    online: 2,
    unread: 0,
    category: "Work",
    tint: ["#F3E8FF", "#9333EA"],
    icon: "rocket",
  },
  {
    id: "9",
    name: "Placement Preparation",
    description: "Interview questions and resources",
    message: "Neha: Uploaded aptitude notes",
    time: "5h",
    members: 24,
    online: 6,
    unread: 0,
    category: "Study",
    tint: ["#FFE4E6", "#BE123C"],
    icon: "book",
  },
];

const TABS = ["All", "Unread", "Work", "Friends", "Study"] as const;
type GroupTab = (typeof TABS)[number];

function CreateGroupSheet({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!visible) {
      setName("");
      setDescription("");
    }
  }, [visible]);

  const submit = () => {
    if (!name.trim()) {
      Alert.alert("Group name required", "Please enter a name for your group.");
      return;
    }
    onCreate(name.trim(), description.trim());
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={local.form}>
        <View style={local.formHeader}>
          <View style={local.formIcon}>
            <Ionicons name="people" size={22} color={colors.primary} />
          </View>
          <View style={local.formHeaderText}>
            <Text style={local.formTitle}>Create new group</Text>
            <Text style={local.formSub}>Bring your people together.</Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close create group"
          >
            <Ionicons name="close" size={22} color={MUTED} />
          </Pressable>
        </View>

        <FieldLabel>Group name</FieldLabel>
        <Field
          value={name}
          onChangeText={setName}
          placeholder="e.g. Project Team"
          maxLength={60}
          autoFocus
          returnKeyType="next"
        />

        <FieldLabel style={{ marginTop: 16 }}>
          Description (optional)
        </FieldLabel>
        <Field
          value={description}
          onChangeText={setDescription}
          placeholder="What is this group about?"
          maxLength={160}
          multiline
          textAlignVertical="top"
          style={local.textarea}
        />

        <PrimaryButton
          label="Create group"
          icon="add"
          onPress={submit}
          style={{ marginTop: 20 }}
        />
        <Text style={local.note}>
          New groups are saved locally until connected to your API.
        </Text>
      </View>
    </BottomSheet>
  );
}

export default function Groups() {
  const router = useRouter();
  const go = useCallback(
    (path: string) => router.push(path as never),
    [router],
  );

  const reduceMotion = useReduceMotion();
  const { scrolled, onScroll } = useScrolled();

  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [tab, setTab] = useState<GroupTab>("All");
  const [query, setQuery] = useState("");
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [createVisible, setCreateVisible] = useState(false);

  const update = useCallback((id: string, patch: Partial<Group>) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    );
  }, []);

  const totalUnread = groups.reduce((n, g) => n + g.unread, 0);
  const unreadCount = groups.filter((g) => g.unread > 0).length;
  const sheetGroup = groups.find((g) => g.id === sheetId) ?? null;
  const q = query.trim().toLowerCase();
  const close = () => setSheetId(null);

  const sections = useMemo(() => {
    const filtered = groups.filter((g) => {
      const matchesTab =
        tab === "All" ||
        (tab === "Unread" && g.unread > 0) ||
        g.category === tab;
      const matchesQuery =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.message.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q);
      return matchesTab && matchesQuery;
    });
    const pinned = filtered.filter((g) => g.pinned);
    const rest = filtered.filter((g) => !g.pinned);
    const out: { title: string; data: Group[] }[] = [];
    if (pinned.length) out.push({ title: "Pinned", data: pinned });
    if (rest.length) out.push({ title: "All groups", data: rest });
    return out;
  }, [groups, tab, q]);

  const activeGroups = useMemo(
    () =>
      groups
        .filter((g) => g.online > 0)
        .sort((a, b) => b.online - a.online)
        .slice(0, 8),
    [groups],
  );

  const openGroup = useCallback((g: Group) => go(`/chat/${g.id}`), [go]);

  const createGroup = useCallback(
    (name: string, description: string) => {
      const newGroup: Group = {
        id: `local-${Date.now()}`,
        name,
        description: description || "New group",
        message: "Group created. Start chatting!",
        time: "Now",
        members: 1,
        online: 1,
        unread: 0,
        category: "Friends",
        tint: ["#EDE9FE", "#6D28D9"],
        icon: "people",
      };
      setGroups((prev) => [newGroup, ...prev]);
      setTab("All");
      setQuery("");
      setCreateVisible(false);
      Alert.alert(
        "Group created",
        "The group has been added to this screen. Connect your group API to persist it and add actual members.",
        [
          { text: "OK" },
          { text: "Open group", onPress: () => openGroup(newGroup) },
        ],
      );
    },
    [openGroup],
  );

  const confirmDelete = (g: Group) => {
    close();
    Alert.alert(
      "Remove group?",
      `Remove "${g.name}" from this screen? This demo action does not delete anything from your backend.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => setGroups((prev) => prev.filter((x) => x.id !== g.id)),
        },
      ],
    );
  };

  const emptyTitle = q
    ? `No results for “${query.trim()}”`
    : tab === "Unread"
      ? "All caught up!"
      : "No groups yet";
  const emptySub = q
    ? "Check the spelling or try a different name."
    : tab === "Unread"
      ? "You have no unread group messages."
      : "Create a group and start a conversation with your people.";

  return (
    <Screen>
      <ScreenTop
        title="Groups"
        subtitle={
          totalUnread > 0
            ? `${totalUnread} unread messages`
            : "Stay connected with your people"
        }
        scrolled={scrolled}
        actions={
          <>
            <HeaderButton
              icon="people-outline"
              label="Create a group"
              onPress={() => setCreateVisible(true)}
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
          placeholder="Search groups or messages"
          label="Search groups"
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
        keyExtractor={(g) => g.id}
        stickySectionHeadersEnabled={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listContentStyle}
        ListHeaderComponent={
          !q && tab === "All" && activeGroups.length > 0 ? (
            <StripSection
              title="Active groups"
              right={
                <View style={local.live}>
                  <View style={local.liveDot} />
                  <Text style={local.liveText}>LIVE</Text>
                </View>
              }
            >
              {activeGroups.map((g) => (
                <StripItem
                  key={g.id}
                  label={g.name.split(" ")[0]}
                  accessibilityLabel={`${g.name}, ${g.online} online`}
                  onPress={() => openGroup(g)}
                  avatar={
                    <Avatar icon={g.icon} tint={g.tint} size={46} online />
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
                  icon={item.icon}
                  tint={item.tint}
                  online={item.online > 0}
                />
              }
              title={item.name}
              titleStrong={unread}
              time={item.time}
              timeStrong={unread}
              onPress={() => openGroup(item)}
              onLongPress={() => setSheetId(item.id)}
              accessibilityHint="Long press for group options"
              accessibilityLabel={`${item.name}, ${item.members} members, ${item.online} online`}
              metaLine={
                <CaptionLine>
                  <Ionicons name="people-outline" size={13} color={MUTED} />
                  <Caption>{item.members} members</Caption>
                  <View style={local.dotSep} />
                  <View style={local.liveDot} />
                  <Caption tone="online">{item.online} online</Caption>
                </CaptionLine>
              }
            >
              {item.mine && (
                <Ionicons
                  name="checkmark-done"
                  size={15}
                  color={item.read ? colors.primary : MUTED}
                  style={rowIconStyle}
                />
              )}
              {item.pinned && (
                <Ionicons
                  name="pin"
                  size={12}
                  color={MUTED}
                  style={rowIconStyle}
                />
              )}
              <PreviewText strong={unread} accent={item.typing}>
                {item.message}
              </PreviewText>
              <RowMeta>
                {item.muted && (
                  <Ionicons
                    name="notifications-off-outline"
                    size={13}
                    color={MUTED}
                  />
                )}
                {unread && <Badge count={item.unread} muted={item.muted} />}
              </RowMeta>
            </ListRow>
          );
        }}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <EmptyState
            icon={q ? "search" : "people-outline"}
            title={emptyTitle}
            subtitle={emptySub}
            action={
              !q && tab !== "Unread" ? (
                <PrimaryButton
                  label="Create group"
                  icon="add"
                  onPress={() => setCreateVisible(true)}
                  style={{ marginTop: 16, height: 42 }}
                />
              ) : undefined
            }
          />
        }
      />

      <Fab
        icon="add"
        label="Create new group"
        onPress={() => setCreateVisible(true)}
      />

      <ActionSheet
        visible={!!sheetGroup}
        onClose={close}
        title={sheetGroup?.name}
        subtitle={
          sheetGroup
            ? `${sheetGroup.members} members · ${sheetGroup.online} online`
            : undefined
        }
        avatar={
          sheetGroup && (
            <Avatar
              icon={sheetGroup.icon}
              tint={sheetGroup.tint}
              size={42}
              online={sheetGroup.online > 0}
            />
          )
        }
      >
        {sheetGroup && (
          <>
            <SheetAction
              icon="information-circle-outline"
              label="Group information"
              onPress={() => {
                close();
                Alert.alert(
                  sheetGroup.name,
                  `${sheetGroup.description}\n\n${sheetGroup.members} members\n${sheetGroup.online} online`,
                );
              }}
            />
            <SheetAction
              icon={sheetGroup.pinned ? "pin-outline" : "pin"}
              label={sheetGroup.pinned ? "Unpin group" : "Pin group"}
              onPress={() => {
                update(sheetGroup.id, { pinned: !sheetGroup.pinned });
                close();
              }}
            />
            <SheetAction
              icon={
                sheetGroup.muted
                  ? "notifications-outline"
                  : "notifications-off-outline"
              }
              label={
                sheetGroup.muted ? "Unmute notifications" : "Mute notifications"
              }
              onPress={() => {
                update(sheetGroup.id, { muted: !sheetGroup.muted });
                close();
              }}
            />
            <SheetAction
              icon={
                sheetGroup.unread > 0 ? "checkmark-done" : "mail-unread-outline"
              }
              label={sheetGroup.unread > 0 ? "Mark as read" : "Mark as unread"}
              onPress={() => {
                update(sheetGroup.id, {
                  unread: sheetGroup.unread > 0 ? 0 : 1,
                });
                close();
              }}
            />
            <SheetAction
              icon="trash-outline"
              label="Remove group"
              onPress={() => confirmDelete(sheetGroup)}
              danger
            />
          </>
        )}
      </ActionSheet>

      <CreateGroupSheet
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreate={createGroup}
      />
    </Screen>
  );
}

const local = StyleSheet.create({
  live: { flexDirection: "row", alignItems: "center", gap: 5 },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ONLINE,
  },
  liveText: {
    fontFamily: fonts.semiBold,
    fontSize: 9,
    lineHeight: 13,
    color: ONLINE,
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 2,
  },

  form: { paddingHorizontal: 12 },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  formIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.control,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
  },
  formHeaderText: { flex: 1 },
  formTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
    includeFontPadding: false,
  },
  formSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: MUTED,
    includeFontPadding: false,
  },
  textarea: { minHeight: 80, paddingTop: 12, paddingBottom: 12 },
  note: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    lineHeight: 15,
    color: MUTED,
    textAlign: "center",
    marginTop: 10,
    includeFontPadding: false,
  },
});
