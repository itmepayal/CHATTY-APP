import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Avatar,
  BottomSheet,
  HeaderButton,
  IconName,
  Screen,
  Text,
  TextInput,
  Tint,
  BG,
  SURFACE,
  TEXT,
  TEXT_2,
  MUTED,
  LINE,
  ONLINE,
  colors,
  fonts,
  space,
} from "../../components/ui";
import AiAssistSheet, { AiMode } from "../../components/chat/AiAssistSheet";
import EmojiPicker from "../../components/chat/EmojiPicker";
import {
  VoiceRecorderBar,
  VoicePlayer,
  fmtDur,
} from "../../components/chat/VoiceMessage";
import VideoRecorderModal from "../../components/chat/VideoRecorderModal";

type Contact = {
  name: string;
  type: "personal" | "group";
  online?: boolean;
  members?: number;
  icon?: IconName;
  tint: Tint;
};

const CONTACTS: Record<string, Contact> = {
  "1": {
    name: "Rohit Sharma",
    type: "personal",
    online: true,
    tint: ["#FFE8D6", "#C2410C"],
  },
  "2": {
    name: "Family Group",
    type: "group",
    members: 5,
    icon: "home",
    tint: ["#DBEAFE", "#1D4ED8"],
  },
  "3": {
    name: "Work Team",
    type: "group",
    members: 8,
    icon: "briefcase",
    tint: ["#EDE9FE", "#6D28D9"],
  },
  "4": {
    name: "Priya Singh",
    type: "personal",
    online: true,
    tint: ["#FCE7F3", "#BE185D"],
  },
  "5": {
    name: "Study Group",
    type: "group",
    members: 12,
    icon: "book",
    tint: ["#D1FAE5", "#047857"],
  },
  "6": { name: "Amit Kumar", type: "personal", tint: ["#FEF3C7", "#B45309"] },
  "7": {
    name: "Neha Verma",
    type: "personal",
    online: true,
    tint: ["#CFFAFE", "#0E7490"],
  },
};

const FALLBACK: Contact = {
  name: "Chat",
  type: "personal",
  tint: ["#E0E7FF", "#4338CA"],
};

const SAMPLE_IMAGE =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=70";

const DANGER = "#DC2626";
const EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

type Status = "sent" | "delivered" | "read";

type Msg = {
  kind: "msg";
  id: string;
  mine: boolean;
  text?: string;
  image?: string;
  voice?: { duration: number; bars: number[] };
  video?: { duration: number; thumb: string };
  time: string;
  status?: Status;
  sender?: string;
  reactions?: string[];
  myReaction?: string;
  edited?: boolean;
  pinned?: boolean;
  forwarded?: boolean;
  deleted?: boolean;
  replyTo?: { id: string; name: string; text: string };
};

type Item =
  | { kind: "date"; id: string; label: string }
  | { kind: "system"; id: string; text: string }
  | Msg;

type SheetType =
  | "attach"
  | "menu"
  | "actions"
  | "forward"
  | "schedule"
  | "scheduled"
  | "disappearing"
  | "report"
  | "pinned"
  | "ai"
  | "emoji";

type Scheduled = { id: string; text: string; when: string };
type Disappearing = "off" | "24h" | "7d" | "90d";

const DISAPPEARING: { key: Disappearing; label: string; sub: string }[] = [
  { key: "off", label: "Off", sub: "Messages stay until deleted" },
  { key: "24h", label: "24 hours", sub: "Messages vanish after a day" },
  { key: "7d", label: "7 days", sub: "Messages vanish after a week" },
  { key: "90d", label: "90 days", sub: "Messages vanish after 3 months" },
];

const REPORT_REASONS = [
  "Spam",
  "Harassment or bullying",
  "Inappropriate content",
  "Fake account",
  "Other",
];

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const fmtWhen = (d: Date) =>
  d.toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

const schedulePresets = () => {
  const n = new Date();
  const inHour = new Date(n.getTime() + 60 * 60 * 1000);
  const tonight = new Date(n);
  tonight.setHours(21, 0, 0, 0);
  if (tonight <= n) tonight.setDate(tonight.getDate() + 1);
  const tomorrow = new Date(n);
  tomorrow.setDate(n.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const monday = new Date(n);
  monday.setDate(n.getDate() + ((8 - n.getDay()) % 7 || 7));
  monday.setHours(9, 0, 0, 0);
  return [
    { label: "In 1 hour", when: inHour },
    { label: "Tonight", when: tonight },
    { label: "Tomorrow morning", when: tomorrow },
    { label: "Monday morning", when: monday },
  ];
};

const preview = (m: Msg) =>
  m.deleted
    ? "Deleted message"
    : m.text
      ? m.text
      : m.voice
        ? `🎤 Voice message (${fmtDur(m.voice.duration)})`
        : m.video
          ? `🎥 Video (${fmtDur(m.video.duration)})`
          : m.image
            ? "📷 Photo"
            : "";

const seedFor = (c: Contact): Item[] =>
  c.type === "group"
    ? [
        { kind: "date", id: "d1", label: "Today" },
        {
          kind: "msg",
          id: "m0",
          mine: false,
          sender: "Ankit",
          text: "Next class on Monday at 10 AM",
          time: "9:10 AM",
          pinned: true,
        },
        {
          kind: "msg",
          id: "m1",
          mine: false,
          sender: "Ankit",
          text: "Important notes attached.",
          time: "9:13 AM",
        },
        {
          kind: "msg",
          id: "m2",
          mine: false,
          sender: "Sneha",
          text: "That's helpful! 👍",
          time: "9:15 AM",
        },
        {
          kind: "msg",
          id: "m3",
          mine: true,
          text: "Thanks everyone! 🙌",
          time: "9:16 AM",
          status: "read",
        },
      ]
    : [
        { kind: "date", id: "d1", label: "Today" },
        {
          kind: "msg",
          id: "m1",
          mine: true,
          text: "Hey! How are you? 😊",
          time: "10:24 AM",
          status: "read",
          pinned: true,
        },
        {
          kind: "msg",
          id: "m2",
          mine: false,
          text: "I'm good! Just finished my work. Let's catch up later.",
          time: "10:26 AM",
        },
        {
          kind: "msg",
          id: "m3",
          mine: false,
          image: SAMPLE_IMAGE,
          text: "Check this out!",
          time: "10:26 AM",
          reactions: ["❤️", "😍"],
        },
        {
          kind: "msg",
          id: "m4",
          mine: true,
          text: "Wow! That's amazing 😍",
          time: "10:28 AM",
          status: "read",
          edited: true,
          replyTo: { id: "m3", name: "Rohit Sharma", text: "Check this out!" },
        },
        {
          kind: "msg",
          id: "m5",
          mine: false,
          text: "Meeting moved to 4 PM, please confirm.",
          time: "10:30 AM",
          forwarded: true,
        },
        {
          kind: "msg",
          id: "m6",
          mine: false,
          voice: {
            duration: 14,
            bars: [
              0.3, 0.5, 0.8, 0.4, 0.6, 0.9, 0.5, 0.3, 0.7, 0.6, 0.4, 0.8, 0.5,
              0.3, 0.6, 0.9, 0.7, 0.4, 0.5, 0.8, 0.6, 0.3, 0.5, 0.7, 0.4, 0.3,
              0.5, 0.2,
            ],
          },
          time: "10:31 AM",
        },
      ];

const REPLIES = [
  "Haha, sahi hai 😄",
  "Okay, done!",
  "Let me check and tell you.",
  "Sounds good 👍",
  "Call you in 5 minutes.",
];

function DateChip({ label }: { label: string }) {
  return (
    <View style={st.dateWrap}>
      <Text style={st.dateText}>{label}</Text>
    </View>
  );
}

function SystemChip({ text }: { text: string }) {
  return (
    <View style={st.sysWrap}>
      <Ionicons name="timer-outline" size={13} color={colors.primary} />
      <Text style={st.sysText}>{text}</Text>
    </View>
  );
}

function Highlight({
  text,
  q,
  style,
}: {
  text: string;
  q: string;
  style: any;
}) {
  if (!q) return <Text style={style}>{text}</Text>;
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${esc})`, "gi"));
  return (
    <Text style={style}>
      {parts.map((p, i) =>
        p.toLowerCase() === q.toLowerCase() ? (
          <Text key={i} style={st.hl}>
            {p}
          </Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}

function Ticks({ status }: { status?: Status }) {
  if (!status) return null;
  return (
    <Ionicons
      name={status === "sent" ? "checkmark" : "checkmark-done"}
      size={14}
      color={status === "read" ? "#7DD3FC" : "rgba(255,255,255,0.65)"}
    />
  );
}

function Bubble({
  item,
  showSender,
  query,
  isCurrentMatch,
  onLongPress,
  onQuotePress,
  onVideoPress,
}: {
  item: Msg;
  showSender: boolean;
  query: string;
  isCurrentMatch: boolean;
  onLongPress: () => void;
  onQuotePress: (id: string) => void;
  onVideoPress: (m: Msg) => void;
}) {
  const { mine } = item;
  const hasMedia = !!item.image || !!item.video;

  const reactionList = useMemo(
    () => [
      ...(item.reactions ?? []),
      ...(item.myReaction ? [item.myReaction] : []),
    ],
    [item.reactions, item.myReaction],
  );
  const grouped = useMemo(() => {
    const map: Record<string, number> = {};
    reactionList.forEach((r) => (map[r] = (map[r] ?? 0) + 1));
    return Object.entries(map);
  }, [reactionList]);
  const hasReactions = !item.deleted && grouped.length > 0;

  if (item.deleted) {
    return (
      <View style={[st.msgRow, mine ? st.msgRowMine : st.msgRowTheirs]}>
        <View style={st.deletedBubble}>
          <Ionicons name="ban-outline" size={14} color={MUTED} />
          <Text style={st.deletedText}>
            {mine ? "You deleted this message" : "This message was deleted"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[st.msgRow, mine ? st.msgRowMine : st.msgRowTheirs]}>
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={250}
        accessibilityHint="Long press for message options"
        style={[
          st.bubble,
          mine ? st.bubbleMine : st.bubbleTheirs,
          hasMedia && st.bubbleMedia,
          isCurrentMatch && st.bubbleMatch,
          hasReactions && { marginBottom: 12 },
        ]}
      >
        {item.forwarded && (
          <View style={st.fwdRow}>
            <Ionicons
              name="arrow-redo"
              size={11}
              color={mine ? "rgba(255,255,255,0.75)" : MUTED}
            />
            <Text
              style={[st.fwdText, mine && { color: "rgba(255,255,255,0.75)" }]}
            >
              Forwarded
            </Text>
          </View>
        )}

        {showSender && !!item.sender && !mine && (
          <Text style={st.sender}>{item.sender}</Text>
        )}

        {!!item.replyTo && (
          <Pressable
            onPress={() => onQuotePress(item.replyTo!.id)}
            style={[st.quote, mine ? st.quoteMine : st.quoteTheirs]}
          >
            <Text
              style={[st.quoteName, mine && { color: "#fff" }]}
              numberOfLines={1}
            >
              {item.replyTo.name}
            </Text>
            <Text
              style={[
                st.quoteText,
                mine && { color: "rgba(255,255,255,0.85)" },
              ]}
              numberOfLines={2}
            >
              {item.replyTo.text}
            </Text>
          </Pressable>
        )}

        {!!item.image && (
          <Image source={{ uri: item.image }} style={st.image} />
        )}

        {!!item.video && (
          <Pressable
            onPress={() => onVideoPress(item)}
            onLongPress={onLongPress}
            delayLongPress={250}
            accessibilityRole="button"
            accessibilityLabel={`Play video, ${fmtDur(item.video.duration)}`}
          >
            <Image source={{ uri: item.video.thumb }} style={st.image} />
            <View style={st.videoOverlay}>
              <View style={st.playCircle}>
                <Ionicons
                  name="play"
                  size={22}
                  color="#fff"
                  style={{ marginLeft: 2 }}
                />
              </View>
            </View>
            <View style={st.durChip}>
              <Ionicons name="videocam" size={11} color="#fff" />
              <Text style={st.durChipText}>{fmtDur(item.video.duration)}</Text>
            </View>
          </Pressable>
        )}

        {!!item.voice && (
          <VoicePlayer
            duration={item.voice.duration}
            bars={item.voice.bars}
            mine={mine}
          />
        )}

        {!!item.text && (
          <Highlight
            text={item.text}
            q={query}
            style={[
              st.msgText,
              mine && st.msgTextMine,
              hasMedia && { paddingHorizontal: 6, paddingTop: 6 },
            ]}
          />
        )}

        <View
          style={[
            st.metaRow,
            hasMedia && { paddingHorizontal: 6, paddingBottom: 2 },
          ]}
        >
          {item.pinned && (
            <Ionicons
              name="pin"
              size={11}
              color={mine ? "rgba(255,255,255,0.75)" : MUTED}
            />
          )}
          {item.edited && (
            <Text style={[st.time, mine && st.timeMine]}>edited</Text>
          )}
          <Text style={[st.time, mine && st.timeMine]}>{item.time}</Text>
          {mine && <Ticks status={item.status} />}
        </View>

        {hasReactions && (
          <View style={[st.reactions, mine ? { right: 10 } : { left: 10 }]}>
            {grouped.map(([emoji, n]) => (
              <Text key={emoji} style={st.reaction}>
                {emoji}
                {n > 1 ? ` ${n}` : ""}
              </Text>
            ))}
          </View>
        )}
      </Pressable>
    </View>
  );
}

function TypingBubble() {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(d, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(d, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(300 - i * 140 > 0 ? 300 - i * 140 : 0),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [dots]);

  return (
    <View style={[st.msgRow, st.msgRowTheirs]}>
      <View style={[st.bubble, st.bubbleTheirs, st.typing]}>
        {dots.map((d, i) => (
          <Animated.View
            key={i}
            style={[
              st.dot,
              {
                opacity: d.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.35, 1],
                }),
                transform: [
                  {
                    translateY: d.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -3],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function SheetRow({
  icon,
  label,
  sub,
  danger,
  right,
  onPress,
}: {
  icon: IconName;
  label: string;
  sub?: string;
  danger?: boolean;
  right?: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [st.row, pressed && { backgroundColor: SURFACE }]}
    >
      <View style={[st.rowIcon, danger && { backgroundColor: "#FEE2E2" }]}>
        <Ionicons
          name={icon}
          size={19}
          color={danger ? DANGER : colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[st.rowLabel, danger && { color: DANGER }]}>{label}</Text>
        {!!sub && <Text style={st.rowSub}>{sub}</Text>}
      </View>
      {right}
    </Pressable>
  );
}

function Radio({ on }: { on: boolean }) {
  return (
    <View style={[st.radio, on && { borderColor: colors.primary }]}>
      {on && <View style={st.radioDot} />}
    </View>
  );
}

function Toast({
  msg,
  actionLabel,
  onAction,
  bottom,
}: {
  msg: string;
  actionLabel?: string;
  onAction?: () => void;
  bottom: number;
}) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [a]);
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        st.toastWrap,
        {
          bottom,
          opacity: a,
          transform: [
            {
              translateY: a.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={st.toast}>
        <Text style={st.toastText}>{msg}</Text>
        {!!actionLabel && (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={st.toastAction}>{actionLabel}</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const ATTACH: { icon: IconName; label: string; tint: Tint }[] = [
  { icon: "image", label: "Photos", tint: ["#FFE8D6", "#C2410C"] },
  { icon: "camera", label: "Camera", tint: ["#DBEAFE", "#1D4ED8"] },
  { icon: "videocam", label: "Video", tint: ["#FEE2E2", "#B91C1C"] },
  { icon: "document-text", label: "Document", tint: ["#EDE9FE", "#6D28D9"] },
  { icon: "location", label: "Location", tint: ["#D1FAE5", "#047857"] },
  { icon: "time", label: "Schedule", tint: ["#FCE7F3", "#BE185D"] },
];

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = Array.isArray(id) ? id[0] : (id ?? "");
  const contact = CONTACTS[chatId] ?? FALLBACK;
  const isGroup = contact.type === "group";

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/" as never);
  };

  const [items, setItems] = useState<Item[]>(() => seedFor(contact));
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);

  const [sheet, setSheet] = useState<SheetType>("attach");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState<Msg | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);

  const [recording, setRecording] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [matchPos, setMatchPos] = useState(0);

  const [disappearing, setDisappearing] = useState<Disappearing>("off");
  const [archived, setArchived] = useState(false);
  const [scheduled, setScheduled] = useState<Scheduled[]>([
    { id: "s1", text: "Happy birthday! 🎂", when: "Tomorrow, 9:00 AM" },
  ]);
  const [fwdSel, setFwdSel] = useState<string[]>([]);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState("");
  const [pinnedCursor, setPinnedCursor] = useState(0);

  const [aiSeed, setAiSeed] = useState<{
    text: string;
    mode: AiMode;
    key: number;
  }>({ text: "", mode: "correct", key: 0 });

  const [toast, setToast] = useState<{
    msg: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const [showDown, setShowDown] = useState(false);

  const listRef = useRef<FlatList<Item>>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const showToast = useCallback(
    (msg: string, actionLabel?: string, onAction?: () => void) => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ msg, actionLabel, onAction });
      toastTimer.current = setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKbOpen(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKbOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
      timers.current.forEach(clearTimeout);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const data = useMemo(() => [...items].reverse(), [items]);

  const openSheet = (s: SheetType) => {
    Keyboard.dismiss();
    setSheet(s);
    setSheetOpen(true);
  };
  const closeSheet = () => setSheetOpen(false);

  const openAi = (seedText: string, mode: AiMode = "correct") => {
    setAiSeed({ text: seedText, mode, key: Date.now() });
    openSheet("ai");
  };

  const push = useCallback((m: Omit<Msg, "kind" | "id">) => {
    const mid = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setItems((prev) => [...prev, { kind: "msg", id: mid, ...m }]);
    return mid;
  }, []);

  const patch = useCallback(
    (msgId: string, fn: (m: Msg) => Msg) =>
      setItems((prev) =>
        prev.map((m) => (m.kind === "msg" && m.id === msgId ? fn(m) : m)),
      ),
    [],
  );

  const q = searchOpen ? query.trim() : "";
  const matches = useMemo(() => {
    if (!q) return [] as number[];
    const lower = q.toLowerCase();
    const out: number[] = [];
    data.forEach((it, i) => {
      if (
        it.kind === "msg" &&
        !it.deleted &&
        it.text?.toLowerCase().includes(lower)
      )
        out.push(i);
    });
    return out;
  }, [data, q]);
  const safePos = matches.length ? Math.min(matchPos, matches.length - 1) : 0;
  const currentMatchId = matches.length
    ? data[matches[safePos]]?.id
    : undefined;

  const scrollToIndex = (index: number) =>
    listRef.current?.scrollToIndex({
      index,
      viewPosition: 0.5,
      animated: true,
    });

  useEffect(() => {
    setMatchPos(0);
  }, [q]);

  useEffect(() => {
    if (matches.length) scrollToIndex(matches[safePos]);
  }, [safePos, matches.length, q]);

  const scrollToMessage = (msgId: string) => {
    const idx = data.findIndex((d) => d.id === msgId);
    if (idx >= 0) scrollToIndex(idx);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  const pinnedMsgs = useMemo(
    () =>
      items.filter(
        (m): m is Msg => m.kind === "msg" && !!m.pinned && !m.deleted,
      ),
    [items],
  );
  const pinnedShown = pinnedMsgs.length
    ? pinnedMsgs[pinnedMsgs.length - 1 - (pinnedCursor % pinnedMsgs.length)]
    : null;

  const buildReply = () =>
    replyTo
      ? {
          id: replyTo.id,
          name: replyTo.mine ? "You" : (replyTo.sender ?? contact.name),
          text: preview(replyTo),
        }
      : undefined;

  const afterSend = (mid: string) => {
    later(() => patch(mid, (m) => ({ ...m, status: "delivered" })), 700);

    if (!isGroup) {
      later(() => setTyping(true), 900);
      later(() => {
        setTyping(false);
        setItems((prev) =>
          prev.map((m) =>
            m.kind === "msg" && m.mine ? { ...m, status: "read" } : m,
          ),
        );
        push({
          mine: false,
          text: REPLIES[Math.floor(Math.random() * REPLIES.length)],
          time: nowTime(),
        });
      }, 2500);
    }
  };

  const send = () => {
    const t = text.trim();
    if (!t) return;

    if (editingId) {
      patch(editingId, (m) => ({ ...m, text: t, edited: true }));
      setEditingId(null);
      setText("");
      showToast("Message edited");
      return;
    }

    const mid = push({
      mine: true,
      text: t,
      time: nowTime(),
      status: "sent",
      replyTo: buildReply(),
    });
    setText("");
    setReplyTo(null);
    afterSend(mid);
  };

  const startRecording = () => {
    Keyboard.dismiss();
    if (editingId) {
      setEditingId(null);
      setText("");
    }
    setRecording(true);
  };

  const sendVoice = (seconds: number, bars: number[]) => {
    setRecording(false);
    if (seconds < 1) {
      showToast("Recording bahut chhoti thi");
      return;
    }
    const mid = push({
      mine: true,
      voice: { duration: seconds, bars },
      time: nowTime(),
      status: "sent",
      replyTo: buildReply(),
    });
    setReplyTo(null);
    afterSend(mid);
  };

  const openVideoRecorder = () => {
    closeSheet();
    later(() => setVideoOpen(true), 350);
  };

  const sendVideo = (seconds: number) => {
    setVideoOpen(false);
    const mid = push({
      mine: true,
      video: { duration: seconds, thumb: SAMPLE_IMAGE },
      time: nowTime(),
      status: "sent",
      replyTo: buildReply(),
    });
    setReplyTo(null);
    afterSend(mid);
  };

  const pickEmoji = (e: string) => {
    setText((t) => t + e);
    setRecentEmojis((prev) => [e, ...prev.filter((x) => x !== e)].slice(0, 16));
  };

  const emojiBackspace = () =>
    setText((t) => Array.from(t).slice(0, -1).join(""));

  const scheduleSend = (label: string, when: Date) => {
    const t = text.trim();
    if (!t) {
      closeSheet();
      showToast("Type a message first, then schedule it");
      return;
    }
    setScheduled((prev) => [
      ...prev,
      { id: `s-${Date.now()}`, text: t, when: `${label}, ${fmtWhen(when)}` },
    ]);
    setText("");
    closeSheet();
    showToast(`Scheduled for ${fmtWhen(when)}`);
  };

  const cancelScheduled = (sid: string) => {
    setScheduled((prev) => prev.filter((s) => s.id !== sid));
    showToast("Scheduled message cancelled");
  };

  const openActions = (m: Msg) => {
    if (m.deleted) return;
    setActionMsg(m);
    openSheet("actions");
  };

  const react = (emoji: string) => {
    if (!actionMsg) return;
    patch(actionMsg.id, (m) => ({
      ...m,
      myReaction: m.myReaction === emoji ? undefined : emoji,
    }));
    closeSheet();
  };

  const startReply = () => {
    if (!actionMsg) return;
    setReplyTo(actionMsg);
    setEditingId(null);
    closeSheet();
  };

  const startEdit = () => {
    if (!actionMsg) return;
    setEditingId(actionMsg.id);
    setReplyTo(null);
    setText(actionMsg.text ?? "");
    closeSheet();
  };

  const copyMsg = () => {
    closeSheet();
    showToast("Copied to clipboard");
  };

  const togglePin = (m: Msg) => {
    patch(m.id, (x) => ({ ...x, pinned: !x.pinned }));
    closeSheet();
    showToast(m.pinned ? "Message unpinned" : "Message pinned");
  };

  const deleteForMe = (m: Msg) => {
    setItems((prev) => prev.filter((x) => x.id !== m.id));
    closeSheet();
    showToast("Deleted for you");
  };

  const deleteForEveryone = (m: Msg) => {
    closeSheet();
    Alert.alert(
      "Delete for everyone?",
      "This message will be removed for everyone in this chat.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            patch(m.id, (x) => ({
              ...x,
              deleted: true,
              text: undefined,
              image: undefined,
              voice: undefined,
              video: undefined,
              reactions: [],
              myReaction: undefined,
              pinned: false,
              replyTo: undefined,
            }));
            showToast("Message deleted");
          },
        },
      ],
    );
  };

  const startForward = () => {
    setFwdSel([]);
    setSheet("forward");
  };

  const doForward = () => {
    const n = fwdSel.length;
    closeSheet();
    showToast(`Forwarded to ${n} ${n === 1 ? "chat" : "chats"}`);
  };

  const applyDisappearing = (v: Disappearing) => {
    setDisappearing(v);
    const label = DISAPPEARING.find((d) => d.key === v)?.label ?? "";
    setItems((prev) => [
      ...prev,
      {
        kind: "system",
        id: `sys-${Date.now()}`,
        text:
          v === "off"
            ? "You turned off disappearing messages."
            : `You turned on disappearing messages. New messages will disappear after ${label}.`,
      },
    ]);
    closeSheet();
  };

  const toggleArchive = () => {
    const next = !archived;
    setArchived(next);
    closeSheet();
    showToast(next ? "Chat archived" : "Chat unarchived", "Undo", () =>
      setArchived(!next),
    );
  };

  const submitReport = () => {
    if (!reportReason) return;
    closeSheet();
    setReportReason(null);
    setReportDetails("");
    showToast("Thanks, we'll review your report");
  };

  const subtitle = typing
    ? "typing…"
    : isGroup
      ? `${contact.members} members`
      : contact.online
        ? "Online"
        : "Offline";

  const composerBottom = kbOpen ? 8 : Math.max(insets.bottom, 10);
  const canSchedule = !!text.trim() && !editingId;

  const renderSheet = () => {
    switch (sheet) {
      case "attach":
        return (
          <>
            <Text style={st.sheetTitle}>Share</Text>
            <View style={st.attachRow}>
              {ATTACH.map((a) => (
                <Pressable
                  key={a.label}
                  accessibilityRole="button"
                  accessibilityLabel={a.label}
                  style={st.attachItem}
                  onPress={() => {
                    if (a.label === "Schedule") {
                      setSheet("schedule");
                      return;
                    }
                    if (a.label === "Video") {
                      openVideoRecorder();
                      return;
                    }
                    closeSheet();
                    if (a.label === "Photos") {
                      push({
                        mine: true,
                        image: SAMPLE_IMAGE,
                        time: nowTime(),
                        status: "sent",
                      });
                    }
                  }}
                >
                  <View style={[st.attachIcon, { backgroundColor: a.tint[0] }]}>
                    <Ionicons name={a.icon} size={24} color={a.tint[1]} />
                  </View>
                  <Text style={st.attachLabel}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        );

      case "menu":
        return (
          <>
            <Text style={st.sheetTitle}>{contact.name}</Text>
            <SheetRow
              icon="search"
              label="Search in chat"
              onPress={() => {
                closeSheet();
                setSearchOpen(true);
              }}
            />
            <SheetRow
              icon="sparkles"
              label="AI Assist"
              sub="Fix grammar, rewrite, Hinglish → English"
              onPress={() => openAi(text, "correct")}
            />
            <SheetRow
              icon="pin"
              label="Pinned messages"
              sub={
                pinnedMsgs.length
                  ? `${pinnedMsgs.length} pinned`
                  : "Nothing pinned yet"
              }
              onPress={() => setSheet("pinned")}
            />
            <SheetRow
              icon="timer-outline"
              label="Disappearing messages"
              sub={
                DISAPPEARING.find((d) => d.key === disappearing)?.label ?? "Off"
              }
              onPress={() => setSheet("disappearing")}
            />
            <SheetRow
              icon="time-outline"
              label="Scheduled messages"
              sub={
                scheduled.length
                  ? `${scheduled.length} waiting to send`
                  : "None scheduled"
              }
              onPress={() => setSheet("scheduled")}
            />
            <SheetRow
              icon={archived ? "arrow-undo-outline" : "archive-outline"}
              label={archived ? "Unarchive chat" : "Archive chat"}
              onPress={toggleArchive}
            />
            {!isGroup && (
              <SheetRow
                icon="flag-outline"
                label={`Report ${contact.name.split(" ")[0]}`}
                danger
                onPress={() => setSheet("report")}
              />
            )}
          </>
        );

      case "actions": {
        const m = actionMsg;
        if (!m) return null;
        const canEdit = m.mine && !!m.text && !m.deleted;
        return (
          <>
            <View style={st.emojiRow}>
              {EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => react(e)}
                  accessibilityRole="button"
                  accessibilityLabel={`React ${e}`}
                  style={[st.emojiBtn, m.myReaction === e && st.emojiBtnOn]}
                >
                  <Text style={st.emoji}>{e}</Text>
                </Pressable>
              ))}
            </View>
            <SheetRow icon="arrow-undo" label="Reply" onPress={startReply} />
            {!m.mine && !!m.text && (
              <SheetRow
                icon="language"
                label="Translate to English"
                sub="Hinglish → English"
                onPress={() => openAi(m.text ?? "", "hinglish")}
              />
            )}
            {!!m.text && (
              <SheetRow icon="copy-outline" label="Copy" onPress={copyMsg} />
            )}
            <SheetRow
              icon="arrow-redo"
              label="Forward"
              onPress={startForward}
            />
            <SheetRow
              icon={m.pinned ? "pin-outline" : "pin"}
              label={m.pinned ? "Unpin" : "Pin"}
              onPress={() => togglePin(m)}
            />
            {canEdit && (
              <SheetRow
                icon="create-outline"
                label="Edit"
                onPress={startEdit}
              />
            )}
            <SheetRow
              icon="trash-outline"
              label="Delete for me"
              danger
              onPress={() => deleteForMe(m)}
            />
            {m.mine && (
              <SheetRow
                icon="trash"
                label="Delete for everyone"
                danger
                onPress={() => deleteForEveryone(m)}
              />
            )}
          </>
        );
      }

      case "forward":
        return (
          <>
            <Text style={st.sheetTitle}>Forward to…</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {Object.entries(CONTACTS)
                .filter(([k]) => k !== chatId)
                .map(([k, c]) => {
                  const on = fwdSel.includes(k);
                  return (
                    <Pressable
                      key={k}
                      onPress={() =>
                        setFwdSel((prev) =>
                          on ? prev.filter((x) => x !== k) : [...prev, k],
                        )
                      }
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      style={st.row}
                    >
                      <Avatar
                        name={c.name}
                        icon={c.icon}
                        tint={c.tint}
                        size={38}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={st.rowLabel}>{c.name}</Text>
                        <Text style={st.rowSub}>
                          {c.type === "group"
                            ? `${c.members} members`
                            : "Direct message"}
                        </Text>
                      </View>
                      <View style={[st.check, on && st.checkOn]}>
                        {on && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
            </ScrollView>
            <Pressable
              onPress={fwdSel.length ? doForward : undefined}
              accessibilityRole="button"
              style={[st.primaryBtn, !fwdSel.length && { opacity: 0.4 }]}
            >
              <Ionicons name="send" size={16} color="#fff" />
              <Text style={st.primaryBtnText}>
                {fwdSel.length ? `Send to ${fwdSel.length}` : "Select chats"}
              </Text>
            </Pressable>
          </>
        );

      case "schedule":
        return (
          <>
            <Text style={st.sheetTitle}>Schedule message</Text>
            <View style={st.schedPreview}>
              <Ionicons name="chatbubble-outline" size={15} color={MUTED} />
              <Text
                style={[st.schedPreviewText, !text.trim() && { color: MUTED }]}
                numberOfLines={2}
              >
                {text.trim() || "Type a message first"}
              </Text>
            </View>
            {schedulePresets().map((p) => (
              <SheetRow
                key={p.label}
                icon="time-outline"
                label={p.label}
                sub={fmtWhen(p.when)}
                onPress={() => scheduleSend(p.label, p.when)}
              />
            ))}
            <SheetRow
              icon="calendar-outline"
              label="Pick date & time"
              sub="Custom"
              onPress={() => {
                showToast("Hook up a date-time picker here");
              }}
            />
          </>
        );

      case "scheduled":
        return (
          <>
            <Text style={st.sheetTitle}>Scheduled messages</Text>
            {scheduled.length === 0 ? (
              <View style={st.empty}>
                <Ionicons name="time-outline" size={30} color={MUTED} />
                <Text style={st.emptyText}>No scheduled messages</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                {scheduled.map((s) => (
                  <View key={s.id} style={st.row}>
                    <View style={st.rowIcon}>
                      <Ionicons name="time" size={19} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.rowLabel} numberOfLines={2}>
                        {s.text}
                      </Text>
                      <Text style={st.rowSub}>{s.when}</Text>
                    </View>
                    <Pressable
                      onPress={() => cancelScheduled(s.id)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel scheduled message"
                      style={st.cancelBtn}
                    >
                      <Text style={st.cancelText}>Cancel</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
          </>
        );

      case "disappearing":
        return (
          <>
            <Text style={st.sheetTitle}>Disappearing messages</Text>
            {DISAPPEARING.map((d) => (
              <Pressable
                key={d.key}
                onPress={() => applyDisappearing(d.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: disappearing === d.key }}
                style={st.row}
              >
                <View style={{ flex: 1 }}>
                  <Text style={st.rowLabel}>{d.label}</Text>
                  <Text style={st.rowSub}>{d.sub}</Text>
                </View>
                <Radio on={disappearing === d.key} />
              </Pressable>
            ))}
          </>
        );

      case "report":
        return (
          <>
            <Text style={st.sheetTitle}>
              Report {contact.name.split(" ")[0]}
            </Text>
            {REPORT_REASONS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setReportReason(r)}
                accessibilityRole="radio"
                accessibilityState={{ selected: reportReason === r }}
                style={st.row}
              >
                <Text style={[st.rowLabel, { flex: 1 }]}>{r}</Text>
                <Radio on={reportReason === r} />
              </Pressable>
            ))}
            <View style={st.reportInput}>
              <TextInput
                value={reportDetails}
                onChangeText={setReportDetails}
                placeholder="Add details (optional)"
                placeholderTextColor={MUTED}
                multiline
                style={st.input}
                accessibilityLabel="Report details"
              />
            </View>
            <Pressable
              onPress={submitReport}
              accessibilityRole="button"
              style={[
                st.primaryBtn,
                { backgroundColor: DANGER },
                !reportReason && { opacity: 0.4 },
              ]}
            >
              <Ionicons name="flag" size={16} color="#fff" />
              <Text style={st.primaryBtnText}>Submit report</Text>
            </Pressable>
          </>
        );

      case "pinned":
        return (
          <>
            <Text style={st.sheetTitle}>Pinned messages</Text>
            {pinnedMsgs.length === 0 ? (
              <View style={st.empty}>
                <Ionicons name="pin-outline" size={30} color={MUTED} />
                <Text style={st.emptyText}>Long-press a message to pin it</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                {[...pinnedMsgs].reverse().map((p) => (
                  <Pressable
                    key={p.id}
                    style={st.row}
                    onPress={() => {
                      closeSheet();
                      scrollToMessage(p.id);
                    }}
                  >
                    <View style={st.rowIcon}>
                      <Ionicons name="pin" size={17} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.rowLabel} numberOfLines={2}>
                        {preview(p)}
                      </Text>
                      <Text style={st.rowSub}>
                        {p.mine ? "You" : (p.sender ?? contact.name)} · {p.time}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        patch(p.id, (x) => ({ ...x, pinned: false }))
                      }
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Unpin"
                      style={st.cancelBtn}
                    >
                      <Text style={st.cancelText}>Unpin</Text>
                    </Pressable>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </>
        );

      case "ai":
        return (
          <AiAssistSheet
            key={aiSeed.key}
            initialText={aiSeed.text}
            initialMode={aiSeed.mode}
            onApply={(t) => {
              setText(t);
              closeSheet();
              showToast("Text composer me add ho gaya");
            }}
            onCopy={() => {
              showToast("Copied to clipboard");
            }}
          />
        );

      case "emoji":
        return (
          <EmojiPicker
            recent={recentEmojis}
            preview={text}
            onPick={pickEmoji}
            onBackspace={emojiBackspace}
          />
        );
    }
  };

  return (
    <Screen>
      {searchOpen ? (
        <View style={st.header}>
          <HeaderButton
            icon="chevron-back"
            label="Close search"
            onPress={closeSearch}
          />
          <View style={st.searchWrap}>
            <Ionicons name="search" size={17} color={MUTED} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search in chat"
              placeholderTextColor={MUTED}
              style={[st.input, { paddingVertical: 8 }]}
              autoFocus
              returnKeyType="search"
              accessibilityLabel="Search messages"
            />
            {!!query && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={17} color={MUTED} />
              </Pressable>
            )}
          </View>
          <Text style={st.matchCount}>
            {q
              ? matches.length
                ? `${safePos + 1}/${matches.length}`
                : "0"
              : ""}
          </Text>
          <Pressable
            onPress={() =>
              matches.length &&
              setMatchPos(Math.min(safePos + 1, matches.length - 1))
            }
            hitSlop={6}
            accessibilityLabel="Previous match"
            style={[
              st.navBtn,
              safePos >= matches.length - 1 && { opacity: 0.35 },
            ]}
          >
            <Ionicons name="chevron-up" size={18} color={TEXT} />
          </Pressable>
          <Pressable
            onPress={() =>
              matches.length && setMatchPos(Math.max(safePos - 1, 0))
            }
            hitSlop={6}
            accessibilityLabel="Next match"
            style={[st.navBtn, safePos <= 0 && { opacity: 0.35 }]}
          >
            <Ionicons name="chevron-down" size={18} color={TEXT} />
          </Pressable>
        </View>
      ) : (
        <View style={st.header}>
          <HeaderButton icon="chevron-back" label="Go back" onPress={goBack} />

          <Pressable
            style={st.who}
            onPress={() => router.push(`/chat-info/${chatId}` as never)}
            accessibilityRole="button"
            accessibilityLabel={`${contact.name}, open info`}
          >
            <Avatar
              name={contact.name}
              icon={contact.icon}
              tint={contact.tint}
              size={42}
              online={contact.online && !isGroup}
            />
            <View style={st.whoText}>
              <View style={st.nameRow}>
                <Text style={[st.whoName, { flexShrink: 1 }]} numberOfLines={1}>
                  {contact.name}
                </Text>
                {disappearing !== "off" && (
                  <Ionicons
                    name="timer-outline"
                    size={13}
                    color={colors.primary}
                  />
                )}
              </View>
              <Text
                style={[
                  st.whoSub,
                  (typing || (contact.online && !isGroup)) && {
                    color: typing ? colors.primary : ONLINE,
                  },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            </View>
          </Pressable>

          <View style={st.headerActions}>
            <HeaderButton
              icon="call-outline"
              label="Voice call"
              onPress={() => router.push(`/call/${chatId}` as never)}
            />
            <HeaderButton
              icon="videocam-outline"
              label="Video call"
              onPress={() => router.push(`/video-call/${chatId}` as never)}
            />
            <HeaderButton
              icon="ellipsis-vertical"
              label="More options"
              onPress={() => openSheet("menu")}
            />
          </View>
        </View>
      )}

      {archived && !searchOpen && (
        <Pressable style={st.archivedBar} onPress={toggleArchive}>
          <Ionicons name="archive" size={14} color={colors.primary} />
          <Text style={st.archivedText}>This chat is archived</Text>
          <Text style={st.archivedAction}>Unarchive</Text>
        </Pressable>
      )}

      {!!pinnedShown && !searchOpen && (
        <Pressable
          style={st.pinned}
          accessibilityRole="button"
          accessibilityLabel="Pinned message"
          onPress={() => {
            scrollToMessage(pinnedShown.id);
            setPinnedCursor((c) => c + 1);
          }}
        >
          <View style={st.pinIcon}>
            <Ionicons name="pin" size={13} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.pinTitle}>
              Pinned message
              {pinnedMsgs.length > 1
                ? ` · ${pinnedMsgs.length - 1 - (pinnedCursor % pinnedMsgs.length) + 1}/${pinnedMsgs.length}`
                : ""}
            </Text>
            <Text style={st.pinText} numberOfLines={1}>
              {preview(pinnedShown)}
            </Text>
          </View>
          <Pressable
            hitSlop={10}
            onPress={() => openSheet("pinned")}
            accessibilityRole="button"
            accessibilityLabel="All pinned messages"
          >
            <Ionicons name="list" size={18} color={MUTED} />
          </Pressable>
        </Pressable>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1 }}>
          <FlatList
            ref={listRef}
            data={data}
            inverted
            keyExtractor={(i) => i.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={st.listContent}
            ListHeaderComponent={typing ? <TypingBubble /> : undefined}
            onScroll={(e) => setShowDown(e.nativeEvent.contentOffset.y > 400)}
            scrollEventThrottle={64}
            onScrollToIndexFailed={(info) => {
              listRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: true,
              });
              setTimeout(() => scrollToIndex(info.index), 250);
            }}
            renderItem={({ item, index }) => {
              if (item.kind === "date") return <DateChip label={item.label} />;
              if (item.kind === "system")
                return <SystemChip text={item.text} />;
              const prev = data[index + 1];
              const showSender =
                isGroup &&
                !item.mine &&
                !(prev && prev.kind === "msg" && prev.sender === item.sender);
              return (
                <Bubble
                  item={item}
                  showSender={showSender}
                  query={q}
                  isCurrentMatch={item.id === currentMatchId}
                  onLongPress={() => openActions(item)}
                  onQuotePress={scrollToMessage}
                  onVideoPress={() => showToast("Video playback coming soon")}
                />
              );
            }}
          />

          {showDown && (
            <Pressable
              onPress={() =>
                listRef.current?.scrollToOffset({ offset: 0, animated: true })
              }
              accessibilityRole="button"
              accessibilityLabel="Scroll to latest"
              style={st.fab}
            >
              <Ionicons name="chevron-down" size={20} color={colors.primary} />
            </Pressable>
          )}
        </View>

        <View style={[st.composerWrap, { paddingBottom: composerBottom }]}>
          {(editingId || replyTo) && (
            <View style={st.ctxBar}>
              <View style={st.ctxAccent} />
              <Ionicons
                name={editingId ? "create-outline" : "arrow-undo"}
                size={16}
                color={colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={st.ctxTitle}>
                  {editingId
                    ? "Editing message"
                    : `Replying to ${
                        replyTo?.mine
                          ? "yourself"
                          : (replyTo?.sender ?? contact.name)
                      }`}
                </Text>
                <Text style={st.ctxText} numberOfLines={1}>
                  {editingId
                    ? "Make your changes and tap ✓"
                    : replyTo
                      ? preview(replyTo)
                      : ""}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (editingId) setText("");
                  setEditingId(null);
                  setReplyTo(null);
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Ionicons name="close" size={20} color={MUTED} />
              </Pressable>
            </View>
          )}

          {recording ? (
            <VoiceRecorderBar
              onCancel={() => {
                setRecording(false);
                showToast("Recording discard ho gayi");
              }}
              onSend={sendVoice}
            />
          ) : (
            <View style={st.composer}>
              <Pressable
                onPress={() => openSheet("attach")}
                accessibilityRole="button"
                accessibilityLabel="Attach"
                style={st.attachBtn}
              >
                <Ionicons name="add" size={24} color={colors.primary} />
              </Pressable>

              <View style={st.inputWrap}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Type a message…"
                  placeholderTextColor={MUTED}
                  style={st.input}
                  multiline
                  accessibilityLabel="Message"
                />
                <Pressable
                  onPress={() => openAi(text, "correct")}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="AI assist"
                >
                  <Ionicons name="sparkles" size={20} color={colors.primary} />
                </Pressable>
                <Pressable
                  onPress={() => openSheet("emoji")}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Emoji"
                >
                  <Ionicons name="happy-outline" size={21} color={MUTED} />
                </Pressable>
              </View>

              <Pressable
                onPress={text.trim() ? send : startRecording}
                onLongPress={
                  canSchedule ? () => openSheet("schedule") : undefined
                }
                delayLongPress={350}
                accessibilityRole="button"
                accessibilityHint={
                  canSchedule ? "Long press to schedule" : undefined
                }
                accessibilityLabel={
                  editingId
                    ? "Save edit"
                    : text.trim()
                      ? "Send message"
                      : "Record voice message"
                }
                style={({ pressed }) => [
                  st.sendBtn,
                  pressed && { transform: [{ scale: 0.94 }] },
                ]}
              >
                <Ionicons
                  name={editingId ? "checkmark" : text.trim() ? "send" : "mic"}
                  size={editingId ? 22 : text.trim() ? 18 : 21}
                  color="#fff"
                  style={
                    text.trim() && !editingId ? { marginLeft: 2 } : undefined
                  }
                />
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      <BottomSheet visible={sheetOpen} onClose={closeSheet}>
        {renderSheet()}
      </BottomSheet>

      <VideoRecorderModal
        visible={videoOpen}
        onClose={() => setVideoOpen(false)}
        onSend={sendVideo}
        previewUri={SAMPLE_IMAGE}
      />

      {toast && (
        <Toast
          key={toast.msg}
          msg={toast.msg}
          actionLabel={toast.actionLabel}
          onAction={() => {
            toast.onAction?.();
            setToast(null);
          }}
          bottom={composerBottom + 70}
        />
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.screen,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: BG,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LINE,
  },
  who: { flex: 1, flexDirection: "row", alignItems: "center", minWidth: 0 },
  whoText: { flex: 1, marginLeft: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  whoName: {
    fontFamily: fonts.semiBold,
    fontSize: 14.5,
    lineHeight: 20,
    color: TEXT,
    includeFontPadding: false,
  },
  whoSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: MUTED,
    includeFontPadding: false,
  },
  headerActions: { flexDirection: "row", gap: 8 },

  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: SURFACE,
  },
  matchCount: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 16,
    color: MUTED,
    minWidth: 28,
    textAlign: "center",
    includeFontPadding: false,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
  },
  hl: { backgroundColor: "#FDE68A", color: "#111827", borderRadius: 3 },

  archivedBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: space.screen,
    paddingVertical: 8,
    backgroundColor: "#F5F3FF",
  },
  archivedText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 16,
    color: TEXT_2,
    includeFontPadding: false,
  },
  archivedAction: {
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.primary,
    includeFontPadding: false,
  },

  pinned: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: space.screen,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "#EEF0FF",
  },
  pinIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  pinTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    lineHeight: 14,
    color: colors.primary,
    includeFontPadding: false,
  },
  pinText: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: TEXT_2,
    includeFontPadding: false,
  },

  listContent: {
    paddingHorizontal: space.screen,
    paddingVertical: 12,
    flexGrow: 1,
  },

  fab: {
    position: "absolute",
    right: 16,
    bottom: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  dateWrap: { alignItems: "center", marginVertical: 12 },
  dateText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    lineHeight: 15,
    color: MUTED,
    backgroundColor: SURFACE,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
    includeFontPadding: false,
  },
  sysWrap: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "88%",
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "#EEF0FF",
  },
  sysText: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 10.5,
    lineHeight: 15,
    color: TEXT_2,
    textAlign: "center",
    includeFontPadding: false,
  },

  msgRow: { marginVertical: 3, flexDirection: "row" },
  msgRowMine: { justifyContent: "flex-end" },
  msgRowTheirs: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 13,
    paddingTop: 9,
    paddingBottom: 6,
    borderRadius: 20,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  bubbleTheirs: { backgroundColor: SURFACE, borderBottomLeftRadius: 6 },
  bubbleMedia: { padding: 4, paddingBottom: 6 },
  bubbleMatch: { borderWidth: 2, borderColor: "#F59E0B" },
  deletedBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LINE,
    borderStyle: "dashed",
  },
  deletedText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
    fontStyle: "italic",
    includeFontPadding: false,
  },
  fwdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  fwdText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 14,
    color: MUTED,
    fontStyle: "italic",
    includeFontPadding: false,
  },
  sender: {
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.primary,
    marginBottom: 2,
    includeFontPadding: false,
  },
  quote: {
    borderLeftWidth: 3,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginBottom: 5,
  },
  quoteMine: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderLeftColor: "rgba(255,255,255,0.8)",
  },
  quoteTheirs: { backgroundColor: "#E5E7EB", borderLeftColor: colors.primary },
  quoteName: {
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    lineHeight: 14,
    color: colors.primary,
    includeFontPadding: false,
  },
  quoteText: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: TEXT_2,
    includeFontPadding: false,
  },
  image: { width: 230, height: 160, borderRadius: 16, backgroundColor: LINE },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  playCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  durChip: {
    position: "absolute",
    left: 8,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  durChipText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    lineHeight: 14,
    color: "#fff",
    includeFontPadding: false,
  },
  msgText: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: TEXT,
    includeFontPadding: false,
  },
  msgTextMine: { color: "#fff" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 4,
    marginTop: 2,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: 9.5,
    lineHeight: 13,
    color: MUTED,
    includeFontPadding: false,
  },
  timeMine: { color: "rgba(255,255,255,0.75)" },
  reactions: {
    position: "absolute",
    bottom: -12,
    flexDirection: "row",
    gap: 4,
    backgroundColor: BG,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
  },
  reaction: { fontSize: 12, lineHeight: 17 },

  typing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: MUTED },

  composerWrap: {
    backgroundColor: BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE,
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  ctxBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    paddingVertical: 8,
    paddingRight: 12,
    paddingLeft: 10,
    borderRadius: 14,
    backgroundColor: "#EEF0FF",
    overflow: "hidden",
  },
  ctxAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.primary,
  },
  ctxTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    lineHeight: 15,
    color: colors.primary,
    includeFontPadding: false,
  },
  ctxText: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: TEXT_2,
    includeFontPadding: false,
  },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: SURFACE,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
    color: TEXT,
    paddingVertical: 10,
    includeFontPadding: false,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },

  sheetTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
    paddingHorizontal: 12,
    marginBottom: 10,
    includeFontPadding: false,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 19,
    color: TEXT,
    includeFontPadding: false,
  },
  rowSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: MUTED,
    includeFontPadding: false,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: LINE,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: LINE,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  primaryBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: "#fff",
    includeFontPadding: false,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#EEF0FF",
  },
  cancelText: {
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.primary,
    includeFontPadding: false,
  },
  empty: { alignItems: "center", gap: 8, paddingVertical: 26 },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: MUTED,
    includeFontPadding: false,
  },
  schedPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 6,
    padding: 12,
    borderRadius: 14,
    backgroundColor: SURFACE,
  },
  schedPreviewText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: TEXT,
    includeFontPadding: false,
  },
  reportInput: {
    marginHorizontal: 12,
    marginTop: 6,
    minHeight: 64,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: SURFACE,
  },

  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 6,
    marginBottom: 10,
    padding: 6,
    borderRadius: 28,
    backgroundColor: SURFACE,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBtnOn: { backgroundColor: "#E0E7FF" },
  emoji: { fontSize: 24, lineHeight: 30 },

  attachRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    rowGap: 14,
    paddingBottom: 8,
  },
  attachItem: { alignItems: "center", width: 66 },
  attachIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  attachLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
    color: TEXT_2,
    marginTop: 6,
    includeFontPadding: false,
  },

  toastWrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    maxWidth: "88%",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: "#111827",
  },
  toastText: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#fff",
    includeFontPadding: false,
  },
  toastAction: {
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#A5B4FC",
    includeFontPadding: false,
  },
});
