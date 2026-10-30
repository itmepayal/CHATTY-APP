import React, { useCallback, useMemo, useState } from "react";
import { Alert, SectionList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActionSheet,
  Avatar,
  DANGER,
  EmptyState,
  Fab,
  HeaderButton,
  IconName,
  ListRow,
  ONLINE,
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
  colors,
  listContentStyle,
  rowIconStyle,
  useReduceMotion,
  useScrolled,
} from "../components/ui";

type Direction = "incoming" | "outgoing" | "missed";
type CallKind = "voice" | "video";

type CallItem = {
  id: string;
  name: string;
  direction: Direction;
  kind: CallKind;
  time: string;
  day: "Today" | "Yesterday" | "Earlier";
  duration?: string;
  group?: boolean;
  online?: boolean;
  tint: Tint;
  icon?: IconName;
};

const INITIAL_CALLS: CallItem[] = [
  {
    id: "1",
    name: "Rohit Sharma",
    direction: "incoming",
    kind: "voice",
    time: "10:24 AM",
    day: "Today",
    duration: "12:40",
    online: true,
    tint: ["#FFE8D6", "#C2410C"],
  },
  {
    id: "2",
    name: "Priya Singh",
    direction: "missed",
    kind: "video",
    time: "9:05 AM",
    day: "Today",
    online: true,
    tint: ["#FCE7F3", "#BE185D"],
  },
  {
    id: "3",
    name: "Study Group",
    direction: "outgoing",
    kind: "video",
    time: "8:30 AM",
    day: "Today",
    duration: "45:12",
    group: true,
    icon: "book",
    tint: ["#D1FAE5", "#047857"],
  },
  {
    id: "4",
    name: "Amit Kumar",
    direction: "outgoing",
    kind: "voice",
    time: "9:45 PM",
    day: "Yesterday",
    duration: "03:18",
    tint: ["#FEF3C7", "#B45309"],
  },
  {
    id: "5",
    name: "Neha Verma",
    direction: "missed",
    kind: "voice",
    time: "6:10 PM",
    day: "Yesterday",
    online: true,
    tint: ["#CFFAFE", "#0E7490"],
  },
  {
    id: "6",
    name: "Work Team",
    direction: "incoming",
    kind: "video",
    time: "4:00 PM",
    day: "Yesterday",
    duration: "1:02:44",
    group: true,
    icon: "briefcase",
    tint: ["#EDE9FE", "#6D28D9"],
  },
  {
    id: "7",
    name: "Family Group",
    direction: "incoming",
    kind: "voice",
    time: "Mon, 7:20 PM",
    day: "Earlier",
    duration: "22:05",
    group: true,
    icon: "home",
    tint: ["#DBEAFE", "#1D4ED8"],
  },
  {
    id: "8",
    name: "Rohit Sharma",
    direction: "outgoing",
    kind: "video",
    time: "Sun, 11:15 AM",
    day: "Earlier",
    duration: "08:51",
    online: true,
    tint: ["#FFE8D6", "#C2410C"],
  },
];

const TABS = ["All", "Missed", "Incoming", "Outgoing"] as const;
type Tab = (typeof TABS)[number];

const dirLabel = (c: CallItem) => {
  if (c.direction === "missed") return `Missed ${c.kind} call`;
  const d = c.direction === "incoming" ? "Incoming" : "Outgoing";
  return `${d} ${c.kind}${c.duration ? ` · ${c.duration}` : ""}`;
};

const missedText = (n: number) =>
  n === 0 ? "No missed calls" : `${n} missed ${n === 1 ? "call" : "calls"}`;

const emptyCopy = (tab: Tab) => {
  switch (tab) {
    case "Missed":
      return { title: "No missed calls", sub: "You're all caught up." };
    case "Incoming":
      return {
        title: "No incoming calls",
        sub: "Calls you receive show up here.",
      };
    case "Outgoing":
      return {
        title: "No outgoing calls",
        sub: "Start a call to see it here.",
      };
    default:
      return {
        title: "No calls here",
        sub: "Your voice and video calls will show up here.",
      };
  }
};

export default function Calls() {
  const router = useRouter();
  const go = useCallback(
    (path: string) => router.push(path as never),
    [router],
  );

  const reduceMotion = useReduceMotion();
  const { scrolled, onScroll } = useScrolled();

  const [calls, setCalls] = useState<CallItem[]>(INITIAL_CALLS);
  const [tab, setTab] = useState<Tab>("All");
  const [query, setQuery] = useState("");
  const [sheetId, setSheetId] = useState<string | null>(null);

  const missedCount = calls.filter((c) => c.direction === "missed").length;
  const sheetCall = calls.find((c) => c.id === sheetId) ?? null;
  const q = query.trim().toLowerCase();
  const empty = emptyCopy(tab);
  const close = () => setSheetId(null);

  const startCall = (c: CallItem, kind: CallKind = c.kind) =>
    go(kind === "video" ? `/video-call/${c.id}` : `/call/${c.id}`);

  const sections = useMemo(() => {
    const filtered = calls.filter((c) => {
      if (tab === "Missed" && c.direction !== "missed") return false;
      if (tab === "Incoming" && c.direction !== "incoming") return false;
      if (tab === "Outgoing" && c.direction !== "outgoing") return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q);
    });
    const days: CallItem["day"][] = ["Today", "Yesterday", "Earlier"];
    return days
      .map((d) => ({ title: d, data: filtered.filter((c) => c.day === d) }))
      .filter((sec) => sec.data.length > 0);
  }, [calls, tab, q]);

  const quickDial = useMemo(() => {
    const seen = new Set<string>();
    return calls.filter((c) => {
      if (c.group || seen.has(c.name)) return false;
      seen.add(c.name);
      return true;
    });
  }, [calls]);

  const clearAll = () => {
    if (calls.length === 0) return;
    Alert.alert(
      "Clear call history?",
      "All calls will be removed from this device.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: () => setCalls([]) },
      ],
    );
  };

  return (
    <Screen>
      <ScreenTop
        title="Calls"
        subtitle={missedText(missedCount)}
        scrolled={scrolled}
        actions={
          <>
            <HeaderButton
              icon="trash-outline"
              label="Clear call history"
              onPress={clearAll}
            />
            <HeaderButton
              icon="notifications-outline"
              label="Notifications"
              onPress={() => go("/notifications")}
              dot={missedCount > 0}
            />
          </>
        }
      >
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search calls"
          label="Search calls"
        />
        <TabPills
          tabs={TABS}
          active={tab}
          onChange={setTab}
          badges={{ Missed: missedCount }}
          badgeTone="danger"
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
          !q && tab === "All" && quickDial.length > 0 ? (
            <StripSection title="Quick dial">
              {quickDial.map((p) => (
                <StripItem
                  key={p.id}
                  label={p.name.split(" ")[0]}
                  accessibilityLabel={`Call ${p.name}`}
                  onPress={() => startCall(p)}
                  avatar={
                    <Avatar
                      name={p.name}
                      icon={p.icon}
                      tint={p.tint}
                      size={46}
                      online={p.online && !p.group}
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
          const missed = item.direction === "missed";
          const incoming = item.direction === "incoming" || missed;
          return (
            <ListRow
              index={index}
              reduceMotion={reduceMotion}
              avatar={
                <Avatar
                  name={item.name}
                  icon={item.icon}
                  tint={item.tint}
                  online={item.online && !item.group}
                />
              }
              title={item.name}
              titleDanger={missed}
              time={item.time}
              onPress={() => startCall(item)}
              onLongPress={() => setSheetId(item.id)}
              accessibilityHint="Tap to call again. Long press for more options"
              accessibilityLabel={`${item.name}. ${dirLabel(item)}. ${item.time}`}
            >
              <Ionicons
                name={incoming ? "arrow-down" : "arrow-up"}
                size={13}
                color={missed ? DANGER : ONLINE}
                style={[rowIconStyle, { transform: [{ rotate: "45deg" }] }]}
              />
              <PreviewText>{dirLabel(item)}</PreviewText>
              <RowMeta>
                <Ionicons
                  name={
                    item.kind === "video" ? "videocam-outline" : "call-outline"
                  }
                  size={17}
                  color={missed ? DANGER : colors.primary}
                />
              </RowMeta>
            </ListRow>
          );
        }}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <EmptyState
            icon={q ? "search" : "call-outline"}
            title={q ? `No results for “${query.trim()}”` : empty.title}
            subtitle={
              q ? "Check the spelling or try a different name." : empty.sub
            }
          />
        }
      />

      <Fab icon="call" label="Start new call" onPress={() => go("/new-chat")} />

      <ActionSheet
        visible={!!sheetCall}
        onClose={close}
        title={sheetCall?.name}
        subtitle={
          sheetCall
            ? sheetCall.group
              ? "Group"
              : sheetCall.online
                ? "Online"
                : "Offline"
            : undefined
        }
        avatar={
          sheetCall && (
            <Avatar
              name={sheetCall.name}
              icon={sheetCall.icon}
              tint={sheetCall.tint}
              size={42}
              online={sheetCall.online && !sheetCall.group}
            />
          )
        }
      >
        {sheetCall && (
          <>
            <SheetAction
              icon="call"
              label="Voice call"
              onPress={() => {
                startCall(sheetCall, "voice");
                close();
              }}
            />
            <SheetAction
              icon="videocam"
              label="Video call"
              onPress={() => {
                startCall(sheetCall, "video");
                close();
              }}
            />
            <SheetAction
              icon="trash"
              label="Delete from history"
              danger
              onPress={() => {
                close();
                setCalls((prev) => prev.filter((x) => x.id !== sheetCall.id));
              }}
            />
          </>
        )}
      </ActionSheet>
    </Screen>
  );
}
