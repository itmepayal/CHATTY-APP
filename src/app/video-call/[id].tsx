import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StatusBar, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, IconName, Text, Tint, fonts } from "../../components/ui";
import {
  CALL_BG,
  CALL_CONTACTS,
  CALL_FALLBACK,
  CallButton,
  fmtClock,
  useCallNav,
  useCallTimer,
} from "../../components/call/CallKit";

const NAMES = [
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
const TINTS: Tint[] = [
  ["#FFE8D6", "#C2410C"],
  ["#DBEAFE", "#1D4ED8"],
  ["#EDE9FE", "#6D28D9"],
  ["#FCE7F3", "#BE185D"],
  ["#D1FAE5", "#047857"],
  ["#FEF3C7", "#B45309"],
  ["#CFFAFE", "#0E7490"],
];
const SPEAKING = "#22C55E";
const MAX_TILES = 4;

type Person = {
  id: string;
  name: string;
  tint: Tint;
  self?: boolean;
  micOff?: boolean;
  icon?: IconName;
};

function Tile({
  p,
  speaking,
  camOff,
  micOff,
  extra,
}: {
  p: Person;
  speaking?: boolean;
  camOff?: boolean;
  micOff?: boolean;
  extra?: number;
}) {
  return (
    <View
      style={[
        t.tile,
        { backgroundColor: p.tint[1] + "40" },
        speaking && { borderColor: SPEAKING, borderWidth: 2.5 },
      ]}
    >
      <View style={t.tileCenter}>
        {camOff ? (
          <View style={t.camOff}>
            <Ionicons
              name="videocam-off"
              size={22}
              color="rgba(255,255,255,0.8)"
            />
          </View>
        ) : (
          <Avatar name={p.name} tint={p.tint} size={72} />
        )}
      </View>

      <View style={t.nameChip}>
        <Text style={t.nameText} numberOfLines={1}>
          {p.self ? "You" : p.name}
        </Text>
      </View>
      {micOff && (
        <View style={t.micBadge}>
          <Ionicons name="mic-off" size={12} color="#fff" />
        </View>
      )}

      {!!extra && extra > 0 && (
        <View style={t.moreOverlay}>
          <Text style={t.moreText}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

export default function VideoCall() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = Array.isArray(id) ? id[0] : (id ?? "");
  const contact = CALL_CONTACTS[chatId] ?? CALL_FALLBACK;
  const isGroup = contact.type === "group";
  const { leave } = useCallNav(chatId);

  const [micOff, setMicOff] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [front, setFront] = useState(true);
  const [speakingIdx, setSpeakingIdx] = useState(1);

  const seconds = useCallTimer(true);

  // everyone in the call (self first)
  const people: Person[] = useMemo(() => {
    if (!isGroup) {
      return [
        { id: "me", name: "You", tint: TINTS[0], self: true },
        {
          id: "peer",
          name: contact.name,
          tint: contact.tint,
          icon: contact.icon,
        },
      ];
    }
    const n = Math.max(contact.members ?? 4, 2);
    return NAMES.slice(0, n).map((name, i) => ({
      id: `p-${i}`,
      name,
      tint: TINTS[i % TINTS.length],
      self: i === 0,
      micOff: i === 2, // demo: one remote person is muted
    }));
  }, [isGroup, contact]);

  // fake "active speaker" rotation among remote people
  useEffect(() => {
    if (people.length < 2) return;
    const timer = setInterval(() => {
      setSpeakingIdx((i) => {
        const next = 1 + (i % (people.length - 1));
        return next;
      });
    }, 2400);
    return () => clearInterval(timer);
  }, [people.length]);

  const shown = people.slice(0, MAX_TILES);
  const extra = Math.max(people.length - MAX_TILES, 0);
  const title = isGroup ? `Group Call · ${people.length}` : contact.name;
  const me = people[0];
  const peer = people[1];

  const rows: Person[][] = [];
  for (let i = 0; i < shown.length; i += 2) rows.push(shown.slice(i, i + 2));

  return (
    <View
      style={[
        s.root,
        {
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 16) + 8,
        },
      ]}
    >
      <StatusBar barStyle="light-content" />

      {/* header */}
      <View style={s.top}>
        <Pressable
          onPress={leave}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={s.topBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <View style={s.titleWrap}>
          <Text style={s.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={s.timer}>{fmtClock(seconds)}</Text>
        </View>
        <Pressable
          onPress={() => setFront((f) => !f)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Flip camera"
          style={s.topBtn}
        >
          <Ionicons name="camera-reverse-outline" size={21} color="#fff" />
        </Pressable>
      </View>

      {/* video area */}
      <View style={s.stage}>
        {isGroup ? (
          <View style={s.grid}>
            {rows.map((row, ri) => (
              <View key={ri} style={s.gridRow}>
                {row.map((p, ci) => {
                  const idx = ri * 2 + ci;
                  const isLast = idx === shown.length - 1;
                  return (
                    <Tile
                      key={p.id}
                      p={p}
                      speaking={idx === speakingIdx && !p.self}
                      camOff={p.self ? camOff : false}
                      micOff={p.self ? micOff : p.micOff}
                      extra={isLast ? extra : 0}
                    />
                  );
                })}
                {row.length === 1 && <View style={{ flex: 1 }} />}
              </View>
            ))}
          </View>
        ) : (
          <View style={s.oneToOne}>
            <Tile p={peer} speaking={false} />
            {/* self preview */}
            <View style={s.pip}>
              <Tile p={me} camOff={camOff} micOff={micOff} />
            </View>
          </View>
        )}
      </View>

      {/* controls */}
      <View style={s.controls}>
        <CallButton
          icon={micOff ? "mic-off" : "mic"}
          active={micOff}
          onPress={() => setMicOff((v) => !v)}
          label={micOff ? "Unmute" : "Mute"}
        />
        <CallButton
          icon={camOff ? "videocam-off" : "videocam"}
          active={camOff}
          onPress={() => setCamOff((v) => !v)}
          label={camOff ? "Cam on" : "Cam off"}
        />
        <CallButton
          icon={speaker ? "volume-high" : "volume-mute"}
          active={!speaker}
          onPress={() => setSpeaker((v) => !v)}
          label="Speaker"
        />
        <CallButton icon="call" danger onPress={leave} label="End" />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: CALL_BG, paddingHorizontal: 16 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 21,
    color: "#fff",
    includeFontPadding: false,
  },
  timer: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 16,
    color: "rgba(255,255,255,0.65)",
    includeFontPadding: false,
  },

  stage: { flex: 1, marginVertical: 14 },
  grid: { flex: 1, gap: 10 },
  gridRow: { flex: 1, flexDirection: "row", gap: 10 },

  oneToOne: { flex: 1 },
  pip: { position: "absolute", top: 12, right: 12, width: 104, height: 140 },

  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
});

const t = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 2.5,
    borderColor: "transparent",
  },
  tileCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  camOff: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  nameChip: {
    position: "absolute",
    left: 8,
    bottom: 8,
    maxWidth: "70%",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  nameText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    color: "#fff",
    includeFontPadding: false,
  },
  micBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  moreOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(11,16,32,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: {
    fontFamily: fonts.semiBold,
    fontSize: 26,
    lineHeight: 34,
    color: "#fff",
    includeFontPadding: false,
  },
});
