import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text, SURFACE, MUTED, colors, fonts } from "../ui";

const DANGER = "#DC2626";
const LIVE_BARS = 22; // recording ke waqt live waveform
const SAVED_BARS = 28; // bheje gaye message ki waveform

export const fmtDur = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** levels (0..1) ko fixed number of bars me compress karta hai */
const downsample = (levels: number[], count: number) => {
  if (!levels.length) return Array(count).fill(0.2) as number[];
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const from = Math.floor((i * levels.length) / count);
    const to = Math.max(
      from + 1,
      Math.floor(((i + 1) * levels.length) / count),
    );
    const slice = levels.slice(from, to);
    out.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return out;
};

/* -------------------------------------------------------------------------- */
/*  Recorder bar (composer ki jagah dikhta hai)                                */
/* -------------------------------------------------------------------------- */

type RecorderProps = {
  onCancel: () => void;
  onSend: (seconds: number, bars: number[]) => void;
};

export function VoiceRecorderBar({ onCancel, onSend }: RecorderProps) {
  const [ms, setMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [live, setLive] = useState<number[]>(() => Array(LIVE_BARS).fill(0.12));

  const levels = useRef<number[]>([]);
  const pausedRef = useRef(false);
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Real recording: yahan expo-audio ka permission + recorder start karo
  //   const { granted } = await AudioModule.requestRecordingPermissionsAsync();
  //   recorder.record();   ...unmount par recorder.stop()

  // blinking red dot
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [blink]);

  // timer + fake metering (real app me recorder ki metering value use karo)
  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setMs((m) => m + 120);
      const lvl = 0.15 + Math.random() * 0.85;
      levels.current.push(lvl);
      setLive((prev) => [...prev.slice(1), lvl]);
    }, 120);
    return () => clearInterval(id);
  }, []);

  const seconds = Math.floor(ms / 1000);

  return (
    <View style={r.wrap}>
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Discard recording"
        style={r.trash}
      >
        <Ionicons name="trash-outline" size={21} color={DANGER} />
      </Pressable>

      <View style={r.center}>
        <Animated.View
          style={[
            r.dot,
            { opacity: paused ? 1 : blink },
            paused && { backgroundColor: MUTED },
          ]}
        />
        <Text style={r.timer}>{fmtDur(seconds)}</Text>

        <View style={r.wave}>
          {live.map((v, i) => (
            <View
              key={i}
              style={[r.bar, { height: 4 + v * 22, opacity: paused ? 0.4 : 1 }]}
            />
          ))}
        </View>
      </View>

      <Pressable
        onPress={() => setPaused((p) => !p)}
        accessibilityRole="button"
        accessibilityLabel={paused ? "Resume recording" : "Pause recording"}
        style={r.pause}
      >
        <Ionicons
          name={paused ? "mic" : "pause"}
          size={19}
          color={colors.primary}
        />
      </Pressable>

      <Pressable
        onPress={() => onSend(seconds, downsample(levels.current, SAVED_BARS))}
        accessibilityRole="button"
        accessibilityLabel="Send voice message"
        style={({ pressed }) => [
          r.send,
          pressed && { transform: [{ scale: 0.94 }] },
        ]}
      >
        <Ionicons
          name="send"
          size={18}
          color="#fff"
          style={{ marginLeft: 2 }}
        />
      </Pressable>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Player (chat bubble ke andar)                                             */
/* -------------------------------------------------------------------------- */

type PlayerProps = {
  duration: number;
  bars: number[];
  mine: boolean;
};

export function VoicePlayer({ duration, bars, mine }: PlayerProps) {
  const total = Math.max(duration, 1);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const startedAt = useRef(0);

  // Real playback: expo-audio ka useAudioPlayer(uri) yahan lagao
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const p = (Date.now() - startedAt.current) / (total * 1000);
      if (p >= 1) {
        setPlaying(false);
        setProgress(0);
      } else {
        setProgress(p);
      }
    }, 100);
    return () => clearInterval(id);
  }, [playing, total]);

  const toggle = () => {
    if (!playing) startedAt.current = Date.now() - progress * total * 1000;
    setPlaying((p) => !p);
  };

  const filled = mine ? "#FFFFFF" : colors.primary;
  const empty = mine ? "rgba(255,255,255,0.4)" : "#CBD5E1";
  const shown = playing || progress > 0 ? progress * total : total;

  return (
    <View style={p.wrap}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={
          playing ? "Pause voice message" : "Play voice message"
        }
        style={[
          p.play,
          { backgroundColor: mine ? "rgba(255,255,255,0.22)" : "#fff" },
        ]}
      >
        <Ionicons
          name={playing ? "pause" : "play"}
          size={17}
          color={mine ? "#fff" : colors.primary}
          style={!playing ? { marginLeft: 2 } : undefined}
        />
      </Pressable>

      <View style={{ flex: 1 }}>
        <View style={p.wave}>
          {bars.map((v, i) => (
            <View
              key={i}
              style={[
                p.bar,
                {
                  height: 4 + v * 20,
                  backgroundColor: i / bars.length < progress ? filled : empty,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[p.time, mine && { color: "rgba(255,255,255,0.8)" }]}>
          {fmtDur(shown)}
        </Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const r = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 8, height: 44 },
  trash: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: SURFACE,
    overflow: "hidden",
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: DANGER },
  timer: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: "#111827",
    minWidth: 34,
    includeFontPadding: false,
  },
  wave: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 28,
  },
  bar: { width: 3, borderRadius: 2, backgroundColor: colors.primary },
  pause: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  send: {
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
});

const p = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: 210,
    paddingVertical: 2,
  },
  play: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  wave: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 26,
  },
  bar: { width: 3, borderRadius: 2 },
  time: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: MUTED,
    includeFontPadding: false,
  },
});
