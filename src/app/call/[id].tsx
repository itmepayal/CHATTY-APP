import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, Text, fonts } from "../../components/ui";
import {
  CALL_BG,
  CALL_CONTACTS,
  CALL_FALLBACK,
  CALL_PRIMARY,
  CallButton,
  fmtClock,
  useCallNav,
  useCallTimer,
} from "../../components/call/CallKit";

function PulseRing({ delay, size }: { delay: number; size: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, {
          toValue: 1,
          duration: 2400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, delay]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: t.interpolate({
            inputRange: [0, 1],
            outputRange: [0.35, 0],
          }),
          transform: [
            {
              scale: t.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.9],
              }),
            },
          ],
        },
      ]}
    />
  );
}

type Phase = "calling" | "connected";

export default function CallDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = Array.isArray(id) ? id[0] : (id ?? "");
  const contact = CALL_CONTACTS[chatId] ?? CALL_FALLBACK;
  const { router, leave } = useCallNav(chatId);

  const [phase, setPhase] = useState<Phase>("calling");
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [held, setHeld] = useState(false);

  const seconds = useCallTimer(phase === "connected" && !held);

  useEffect(() => {
    const t = setTimeout(() => setPhase("connected"), 1800);
    return () => clearTimeout(t);
  }, []);

  const status =
    phase === "calling"
      ? "Calling…"
      : held
        ? "On hold"
        : `Voice Call · ${fmtClock(seconds)}`;

  const switchToVideo = () => router.replace(`/video-call/${chatId}` as never);

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

      <View pointerEvents="none" style={s.glowA} />
      <View pointerEvents="none" style={s.glowB} />

      <View style={s.top}>
        <Pressable
          onPress={leave}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Minimize call"
          style={s.topBtn}
        >
          <Ionicons name="chevron-down" size={22} color="#fff" />
        </Pressable>
        <View style={s.enc}>
          <Ionicons
            name="lock-closed"
            size={11}
            color="rgba(255,255,255,0.7)"
          />
          <Text style={s.encText}>End-to-end encrypted</Text>
        </View>
        <Pressable
          onPress={() => setHeld((h) => !h)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={held ? "Resume call" : "Hold call"}
          style={s.topBtn}
        >
          <Ionicons name={held ? "play" : "pause"} size={18} color="#fff" />
        </Pressable>
      </View>

      <View style={s.center}>
        <View style={s.avatarStage}>
          {phase === "connected" && !held && (
            <>
              <PulseRing delay={0} size={140} />
              <PulseRing delay={1200} size={140} />
            </>
          )}
          <View style={s.avatarRing}>
            <Avatar
              name={contact.name}
              icon={contact.icon}
              tint={contact.tint}
              size={132}
            />
          </View>
        </View>

        <Text style={s.name} numberOfLines={1}>
          {contact.name}
        </Text>
        <View style={s.statusPill}>
          {phase === "connected" && !held && <View style={s.liveDot} />}
          <Text style={s.status}>{status}</Text>
        </View>
        {muted && phase === "connected" && (
          <View style={s.mutedChip}>
            <Ionicons name="mic-off" size={12} color="#FCA5A5" />
            <Text style={s.mutedText}>You are muted</Text>
          </View>
        )}
      </View>

      <View style={s.controls}>
        <CallButton
          icon={muted ? "mic-off" : "mic"}
          label={muted ? "Unmute" : "Mute"}
          active={muted}
          onPress={() => setMuted((m) => !m)}
        />
        <CallButton
          icon={speaker ? "volume-high" : "volume-medium"}
          label="Speaker"
          active={speaker}
          onPress={() => setSpeaker((v) => !v)}
        />
        <CallButton icon="videocam" label="Video" onPress={switchToVideo} />
      </View>

      <View style={s.endRow}>
        <CallButton icon="call" size={72} danger onPress={leave} label="End" />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: CALL_BG, paddingHorizontal: 24 },
  glowA: {
    position: "absolute",
    top: -120,
    alignSelf: "center",
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: CALL_PRIMARY,
    opacity: 0.22,
  },
  glowB: {
    position: "absolute",
    bottom: -140,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#7C3AED",
    opacity: 0.12,
  },

  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  enc: { flexDirection: "row", alignItems: "center", gap: 5 },
  encText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.7)",
    includeFontPadding: false,
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  avatarStage: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  ring: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#818CF8",
    backgroundColor: "rgba(129,140,248,0.12)",
  },
  avatarRing: {
    padding: 4,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: "rgba(165,180,252,0.6)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  name: {
    fontFamily: fonts.semiBold,
    fontSize: 26,
    lineHeight: 34,
    color: "#fff",
    textAlign: "center",
    includeFontPadding: false,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#22C55E" },
  status: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.85)",
    includeFontPadding: false,
  },
  mutedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 12,
  },
  mutedText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 16,
    color: "#FCA5A5",
    includeFontPadding: false,
  },

  controls: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 28,
  },
  endRow: { alignItems: "center" },
});
