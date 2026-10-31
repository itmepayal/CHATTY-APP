import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActionSheet,
  Avatar,
  HeaderButton,
  IconName,
  Screen,
  SectionHeader,
  SheetAction,
  Text,
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
  useReduceMotion,
  useScrolled,
} from "../../components/ui";


type Contact = {
  name: string;
  type: "personal" | "group";
  online?: boolean;
  members?: number;
  icon?: IconName;
  tint: Tint;
  about?: string;
  phone?: string;
};

const CONTACTS: Record<string, Contact> = {
  "1": {
    name: "Rohit Sharma",
    type: "personal",
    online: true,
    tint: ["#FFE8D6", "#C2410C"],
    about: "Busy. Ping me later 🙏",
    phone: "+91 98765 43210",
  },
  "2": {
    name: "Family Group",
    type: "group",
    members: 5,
    icon: "home",
    tint: ["#DBEAFE", "#1D4ED8"],
    about: "Our family space. Be kind, be funny. 💙",
  },
  "3": {
    name: "Work Team",
    type: "group",
    members: 8,
    icon: "briefcase",
    tint: ["#EDE9FE", "#6D28D9"],
    about: "Project updates, standups and deadlines.",
  },
  "4": {
    name: "Priya Singh",
    type: "personal",
    online: true,
    tint: ["#FCE7F3", "#BE185D"],
    about: "Coffee first, then everything else ☕",
    phone: "+91 91234 56789",
  },
  "5": {
    name: "Study Group",
    type: "group",
    members: 12,
    icon: "book",
    tint: ["#D1FAE5", "#047857"],
    about: "Notes, doubts and exam prep.",
  },
  "6": {
    name: "Amit Kumar",
    type: "personal",
    tint: ["#FEF3C7", "#B45309"],
    about: "Available",
    phone: "+91 99887 76655",
  },
  "7": {
    name: "Neha Verma",
    type: "personal",
    online: true,
    tint: ["#CFFAFE", "#0E7490"],
    about: "Hey there! I am using Chatty.",
    phone: "+91 90000 11122",
  },
};

const FALLBACK: Contact = {
  name: "Chat",
  type: "personal",
  tint: ["#E0E7FF", "#4338CA"],
};
const SAMPLE_IMAGE =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=70";
const DANGER = "#DC2626";

type Disappearing = "off" | "24h" | "7d" | "90d";
const DISAPPEARING: { key: Disappearing; label: string }[] = [
  { key: "off", label: "Off" },
  { key: "24h", label: "24 hours" },
  { key: "7d", label: "7 days" },
  { key: "90d", label: "90 days" },
];

const MEMBER_NAMES = [
  "You",
  "Ankit",
  "Sneha",
  "Rahul",
  "Mom",
  "Dad",
  "Isha",
  "Karan",
  "Pooja",
  "Vikram",
  "Anjali",
  "Dev",
];
const MEMBER_TINTS: Tint[] = [
  ["#FFE8D6", "#C2410C"],
  ["#DBEAFE", "#1D4ED8"],
  ["#EDE9FE", "#6D28D9"],
  ["#FCE7F3", "#BE185D"],
  ["#D1FAE5", "#047857"],
  ["#FEF3C7", "#B45309"],
  ["#CFFAFE", "#0E7490"],
];

type Member = { id: string; name: string; role?: "You" | "Admin"; tint: Tint };
const buildMembers = (count: number): Member[] =>
  MEMBER_NAMES.slice(0, count).map((name, i) => ({
    id: `mem-${i}`,
    name,
    role: i === 0 ? "You" : i === 1 ? "Admin" : undefined,
    tint: MEMBER_TINTS[i % MEMBER_TINTS.length],
  }));
const MEMBERS_PREVIEW = 5;

const T = {
  blue: ["#DBEAFE", "#1D4ED8"] as Tint,
  green: ["#D1FAE5", "#047857"] as Tint,
  purple: ["#EDE9FE", "#6D28D9"] as Tint,
  amber: ["#FEF3C7", "#B45309"] as Tint,
  pink: ["#FCE7F3", "#BE185D"] as Tint,
  cyan: ["#CFFAFE", "#0E7490"] as Tint,
  red: ["#FEE2E2", DANGER] as Tint,
  slate: ["#E5E7EB", "#374151"] as Tint,
};

function Reveal({
  delay = 0,
  reduce,
  children,
}: {
  delay?: number;
  reduce: boolean;
  children: React.ReactNode;
}) {
  const a = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) return;
    Animated.timing(a, {
      toValue: 1,
      duration: 360,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [a, delay, reduce]);
  return (
    <Animated.View
      style={{
        opacity: a,
        transform: [
          {
            translateY: a.interpolate({
              inputRange: [0, 1],
              outputRange: [14, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

function QuickAction({
  icon,
  label,
  tint,
  active,
  onPress,
}: {
  icon: IconName;
  label: string;
  tint: Tint;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        st.quick,
        pressed && { transform: [{ scale: 0.95 }] },
      ]}
    >
      <View
        style={[st.quickIcon, { backgroundColor: active ? tint[1] : tint[0] }]}
      >
        <Ionicons name={icon} size={21} color={active ? "#fff" : tint[1]} />
      </View>
      <Text style={st.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={st.card}>{children}</View>;
}
const Divider = () => <View style={st.divider} />;

function InfoRow({
  icon,
  label,
  sub,
  tint = ["#EEF0FF", colors.primary] as Tint,
  danger,
  right,
  onPress,
  chevron,
}: {
  icon: IconName;
  label: string;
  sub?: string;
  tint?: Tint;
  danger?: boolean;
  right?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
}) {
  const t = danger ? T.red : tint;
  const body = (
    <>
      <View style={[st.rowIcon, { backgroundColor: t[0] }]}>
        <Ionicons name={icon} size={18} color={t[1]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[st.rowLabel, danger && { color: DANGER }]}>{label}</Text>
        {!!sub && <Text style={st.rowSub}>{sub}</Text>}
      </View>
      {right}
      {chevron && <Ionicons name="chevron-forward" size={16} color={MUTED} />}
    </>
  );
  if (!onPress) return <View style={st.row}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [st.row, pressed && { backgroundColor: LINE }]}
    >
      {body}
    </Pressable>
  );
}

function Stat({
  value,
  label,
  onPress,
}: {
  value: string;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
      style={({ pressed }) => [st.stat, pressed && { opacity: 0.6 }]}
    >
      <Text style={st.statValue}>{value}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </Pressable>
  );
}

export default function ChatInfo() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { scrolled, onScroll } = useScrolled();
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = Array.isArray(id) ? id[0] : (id ?? "");
  const contact = CONTACTS[chatId] ?? FALLBACK;
  const isGroup = contact.type === "group";
  const firstName = contact.name.split(" ")[0];

  const [muted, setMuted] = useState(false);
  const [starredOnly, setStarredOnly] = useState(false);
  const [disappearing, setDisappearing] = useState<Disappearing>("off");
  const [blocked, setBlocked] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);

  const members = useMemo(
    () => (isGroup ? buildMembers(contact.members ?? 0) : []),
    [isGroup, contact.members],
  );
  const visibleMembers = showAllMembers
    ? members
    : members.slice(0, MEMBERS_PREVIEW);

  const subtitle = isGroup
    ? `Group · ${contact.members} members`
    : blocked
      ? "Blocked"
      : contact.online
        ? "Online"
        : "Offline";
  const showOnline = !isGroup && contact.online && !blocked;
  const disappearingLabel =
    DISAPPEARING.find((d) => d.key === disappearing)?.label ?? "Off";

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(`/chat/${chatId}` as never);
  };
  const goCall = () => router.push(`/call/${chatId}` as never);
  const goVideo = () => router.push(`/video-call/${chatId}` as never);

  const confirmBlock = () => {
    if (blocked) return setBlocked(false);
    Alert.alert(
      `Block ${firstName}?`,
      "Blocked contacts can't call or send you messages.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => setBlocked(true),
        },
      ],
    );
  };
  const confirmReport = () =>
    Alert.alert(
      `Report ${isGroup ? "group" : firstName}?`,
      "The last messages from this chat will be sent to us for review.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: () => Alert.alert("Thanks", "We'll review your report."),
        },
      ],
    );
  const confirmExit = () =>
    Alert.alert(
      "Exit group?",
      `You will no longer receive messages from ${contact.name}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => router.replace("/" as never),
        },
      ],
    );
  const confirmClear = () =>
    Alert.alert(
      "Clear chat?",
      "All messages in this chat will be removed from this device.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive" },
      ],
    );

  return (
    <Screen>
      <View style={[st.header, scrolled && st.headerScrolled]}>
        <HeaderButton icon="chevron-back" label="Go back" onPress={goBack} />
        <View style={st.headerCenter}>
          <Text style={st.headerTitle}>
            {isGroup ? "Group info" : "Contact info"}
          </Text>
        </View>
        <HeaderButton
          icon="share-outline"
          label="Share"
          onPress={() =>
            Alert.alert("Share", `Share ${contact.name} (coming soon)`)
          }
        />
      </View>

      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          st.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 28 },
        ]}
      >
        <Reveal reduce={reduceMotion}>
          <View style={st.hero}>
            <View style={[st.banner, { backgroundColor: contact.tint[0] }]}>
              <View
                style={[
                  st.blob,
                  st.blobA,
                  { backgroundColor: contact.tint[1] },
                ]}
              />
              <View
                style={[
                  st.blob,
                  st.blobB,
                  { backgroundColor: contact.tint[1] },
                ]}
              />
            </View>
            <View style={st.avatarRing}>
              <Avatar
                name={contact.name}
                icon={contact.icon}
                tint={contact.tint}
                size={92}
                online={contact.online && !isGroup}
              />
            </View>
            <Text style={st.name} numberOfLines={2}>
              {contact.name}
            </Text>
            <View
              style={[
                st.statusPill,
                showOnline && { backgroundColor: "#DCFCE7" },
                blocked && { backgroundColor: "#FEE2E2" },
              ]}
            >
              {showOnline && <View style={st.statusDot} />}
              <Text
                style={[
                  st.statusText,
                  showOnline && { color: "#15803D" },
                  blocked && { color: DANGER },
                ]}
              >
                {subtitle}
              </Text>
            </View>
            {!isGroup && !!contact.phone && (
              <View style={st.phoneRow}>
                <Ionicons name="call" size={12} color={MUTED} />
                <Text style={st.phone}>{contact.phone}</Text>
              </View>
            )}
          </View>
        </Reveal>

        <Reveal delay={60} reduce={reduceMotion}>
          <View style={st.quickRow}>
            <QuickAction
              icon="chatbubble-ellipses"
              label="Message"
              tint={T.blue}
              onPress={goBack}
            />
            <QuickAction
              icon="call"
              label="Call"
              tint={T.green}
              onPress={goCall}
            />
            <QuickAction
              icon="videocam"
              label="Video"
              tint={T.purple}
              onPress={goVideo}
            />
            <QuickAction
              icon={muted ? "notifications-off" : "notifications"}
              label={muted ? "Unmute" : "Mute"}
              tint={T.amber}
              active={muted}
              onPress={() => setMuted((m) => !m)}
            />
          </View>
        </Reveal>

        {!!contact.about && (
          <Reveal delay={120} reduce={reduceMotion}>
            <SectionHeader title={isGroup ? "Description" : "About"} />
            <Card>
              <View style={st.aboutBox}>
                <Ionicons
                  name="chatbox-ellipses-outline"
                  size={16}
                  color={MUTED}
                  style={{ marginTop: 2 }}
                />
                <Text style={st.aboutText}>{contact.about}</Text>
              </View>
            </Card>
          </Reveal>
        )}

        <Reveal delay={180} reduce={reduceMotion}>
          <SectionHeader title="Media, links and docs" />
          <View style={st.statsCard}>
            <Stat value="24" label="Media" />
            <View style={st.statDivider} />
            <Stat value="6" label="Links" />
            <View style={st.statDivider} />
            <Stat value="3" label="Docs" />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={st.mediaRow}
            style={{ marginTop: 10 }}
          >
            {[0, 1, 2, 3].map((n) => (
              <Pressable
                key={n}
                accessibilityRole="imagebutton"
                accessibilityLabel={`Shared photo ${n + 1}`}
                style={({ pressed }) => [
                  st.mediaItem,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Image source={{ uri: SAMPLE_IMAGE }} style={st.mediaImg} />
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See all media"
              style={({ pressed }) => [
                st.mediaItem,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Image source={{ uri: SAMPLE_IMAGE }} style={st.mediaImg} />
              <View style={st.mediaOverlay}>
                <Text style={st.mediaOverlayText}>+20</Text>
              </View>
            </Pressable>
          </ScrollView>
        </Reveal>

        <Reveal delay={240} reduce={reduceMotion}>
          <SectionHeader title="Chat settings" />
          <Card>
            <InfoRow
              icon="notifications-outline"
              label="Mute notifications"
              sub={muted ? "Muted" : "Notifications are on"}
              tint={T.amber}
              right={
                <Switch
                  value={muted}
                  onValueChange={setMuted}
                  trackColor={{ false: LINE, true: colors.primary }}
                  thumbColor="#fff"
                  accessibilityLabel="Mute notifications"
                />
              }
            />
            <Divider />
            <InfoRow
              icon="star-outline"
              label="Starred messages"
              sub={starredOnly ? "Showing starred first" : "None yet"}
              tint={T.pink}
              onPress={() => setStarredOnly((s) => !s)}
              chevron
            />
            <Divider />
            <InfoRow
              icon="timer-outline"
              label="Disappearing messages"
              sub={disappearingLabel}
              tint={T.cyan}
              onPress={() => setSheetOpen(true)}
              chevron
            />
            <Divider />
            <InfoRow
              icon="lock-closed-outline"
              label="Encryption"
              sub="Messages are end-to-end encrypted"
              tint={T.green}
              right={
                <Ionicons name="shield-checkmark" size={18} color="#047857" />
              }
            />
          </Card>
        </Reveal>

        {isGroup && (
          <Reveal delay={280} reduce={reduceMotion}>
            <SectionHeader title="Members" count={contact.members} />
            <Card>
              <InfoRow
                icon="person-add-outline"
                label="Add members"
                tint={T.blue}
                onPress={() => router.push("/new-group" as never)}
                chevron
              />
              {visibleMembers.map((m) => (
                <React.Fragment key={m.id}>
                  <Divider />
                  <View style={st.row}>
                    <Avatar name={m.name} tint={m.tint} size={38} />
                    <View style={{ flex: 1 }}>
                      <Text style={st.rowLabel}>{m.name}</Text>
                    </View>
                    {m.role === "Admin" && (
                      <View style={st.adminPill}>
                        <Text style={st.adminText}>Admin</Text>
                      </View>
                    )}
                    {m.role === "You" && <Text style={st.youText}>You</Text>}
                  </View>
                </React.Fragment>
              ))}
              {members.length > MEMBERS_PREVIEW && (
                <>
                  <Divider />
                  <InfoRow
                    icon={showAllMembers ? "chevron-up" : "people-outline"}
                    label={
                      showAllMembers
                        ? "Show less"
                        : `See all ${members.length} members`
                    }
                    tint={T.slate}
                    onPress={() => setShowAllMembers((s) => !s)}
                    chevron
                  />
                </>
              )}
            </Card>
          </Reveal>
        )}

        <Reveal delay={320} reduce={reduceMotion}>
          <SectionHeader title="Privacy" />
          <Card>
            <InfoRow
              icon="trash-outline"
              label="Clear chat"
              tint={T.slate}
              onPress={confirmClear}
            />
            <Divider />
            {isGroup ? (
              <>
                <InfoRow
                  icon="exit-outline"
                  label="Exit group"
                  danger
                  onPress={confirmExit}
                />
                <Divider />
                <InfoRow
                  icon="flag-outline"
                  label="Report group"
                  danger
                  onPress={confirmReport}
                />
              </>
            ) : (
              <>
                <InfoRow
                  icon={blocked ? "checkmark-circle-outline" : "ban-outline"}
                  label={
                    blocked ? `Unblock ${firstName}` : `Block ${firstName}`
                  }
                  tint={T.green}
                  danger={!blocked}
                  onPress={confirmBlock}
                />
                <Divider />
                <InfoRow
                  icon="flag-outline"
                  label={`Report ${firstName}`}
                  danger
                  onPress={confirmReport}
                />
              </>
            )}
          </Card>

          <View style={st.footer}>
            <Ionicons name="lock-closed" size={11} color={MUTED} />
            <Text style={st.footerText}>Chatty · End-to-end encrypted</Text>
          </View>
        </Reveal>
      </ScrollView>

      <ActionSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Disappearing messages"
        subtitle={contact.name}
        avatar={
          <Avatar
            name={contact.name}
            icon={contact.icon}
            tint={contact.tint}
            size={42}
            online={contact.online && !isGroup}
          />
        }
      >
        {DISAPPEARING.map((d) => (
          <SheetAction
            key={d.key}
            icon={
              disappearing === d.key ? "radio-button-on" : "radio-button-off"
            }
            label={d.label}
            onPress={() => {
              setDisappearing(d.key);
              setSheetOpen(false);
            }}
          />
        ))}
      </ActionSheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.screen,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: BG,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "transparent",
  },
  headerScrolled: { borderBottomColor: LINE },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 21,
    color: TEXT,
    includeFontPadding: false,
  },

  content: { paddingHorizontal: space.screen },

  hero: { alignItems: "center", paddingTop: 6, paddingBottom: 16 },
  banner: {
    alignSelf: "stretch",
    height: 104,
    borderRadius: 24,
    overflow: "hidden",
  },
  blob: { position: "absolute", borderRadius: 999, opacity: 0.12 },
  blobA: { width: 150, height: 150, right: -30, top: -60 },
  blobB: { width: 90, height: 90, left: -20, bottom: -40 },
  avatarRing: {
    marginTop: -48,
    padding: 4,
    borderRadius: 60,
    backgroundColor: BG,
  },
  name: {
    marginTop: 10,
    fontFamily: fonts.semiBold,
    fontSize: 21,
    lineHeight: 28,
    color: TEXT,
    textAlign: "center",
    includeFontPadding: false,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: SURFACE,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ONLINE },
  statusText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 16,
    color: MUTED,
    includeFontPadding: false,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  phone: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: TEXT_2,
    includeFontPadding: false,
  },

  quickRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  quick: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: SURFACE,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    marginTop: 7,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 16,
    color: TEXT_2,
    includeFontPadding: false,
  },

  card: { borderRadius: 20, backgroundColor: SURFACE, overflow: "hidden" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
    marginLeft: 62,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
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

  aboutBox: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  aboutText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: TEXT,
    includeFontPadding: false,
  },

  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: SURFACE,
    paddingVertical: 12,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    lineHeight: 23,
    color: TEXT,
    includeFontPadding: false,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    color: MUTED,
    includeFontPadding: false,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: LINE,
  },
  mediaRow: { gap: 8, paddingRight: 4 },
  mediaItem: {
    width: 92,
    height: 92,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: LINE,
  },
  mediaImg: { width: "100%", height: "100%" },
  mediaOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(17,24,39,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaOverlayText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 22,
    color: "#fff",
    includeFontPadding: false,
  },

  adminPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#EEF0FF",
  },
  adminText: {
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    lineHeight: 14,
    color: colors.primary,
    includeFontPadding: false,
  },
  youText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 16,
    color: MUTED,
    includeFontPadding: false,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 22,
  },
  footerText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    lineHeight: 15,
    color: MUTED,
    includeFontPadding: false,
  },
});
