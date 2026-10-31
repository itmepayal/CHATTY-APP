import React, { useEffect, useState } from "react";
import { Alert, Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, colors, fonts } from "../ui";
import { fmtDur } from "./VoiceMessage";

const MAX_SECONDS = 60;
const DANGER = "#EF4444";

type Phase = "ready" | "recording" | "review";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSend: (seconds: number) => void;
  previewUri?: string;
};

export default function VideoRecorderModal({
  visible,
  onClose,
  onSend,
  previewUri,
}: Props) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>("ready");
  const [secs, setSecs] = useState(0);
  const [front, setFront] = useState(true);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (visible) {
      setPhase("ready");
      setSecs(0);
    }
  }, [visible]);

  useEffect(() => {
    if (phase !== "recording") return;
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "recording" && secs >= MAX_SECONDS) setPhase("review");
  }, [phase, secs]);

  const start = () => {
    setSecs(0);
    setPhase("recording");
  };

  const stop = () => {
    if (secs < 1) {
      setPhase("ready");
      setSecs(0);
      return;
    }
    setPhase("review");
  };

  const retake = () => {
    setSecs(0);
    setPhase("ready");
  };

  const requestClose = () => {
    if (phase === "ready") {
      onClose();
      return;
    }
    Alert.alert("Video discard karein?", "Ye recording save nahi hogi.", [
      { text: "Rukein", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: onClose },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={requestClose}
      statusBarTranslucent
    >
      <View style={v.root}>
        {phase === "review" && !!previewUri ? (
          <Image source={{ uri: previewUri }} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, v.finder]}>
            <Ionicons name="person" size={120} color="rgba(255,255,255,0.07)" />
            <View style={[v.gridV, { left: "33.3%" }]} />
            <View style={[v.gridV, { left: "66.6%" }]} />
            <View style={[v.gridH, { top: "33.3%" }]} />
            <View style={[v.gridH, { top: "66.6%" }]} />
          </View>
        )}
        {phase === "review" && (
          <View style={[StyleSheet.absoluteFill, v.dim]} />
        )}
        {phase === "review" && (
          <View style={v.reviewPlay}>
            <Ionicons
              name="play"
              size={30}
              color="#fff"
              style={{ marginLeft: 3 }}
            />
          </View>
        )}

        <View style={[v.top, { paddingTop: insets.top + 10 }]}>
          {phase === "recording" && (
            <View style={v.progressTrack}>
              <View
                style={[
                  v.progressFill,
                  { width: `${Math.min(secs / MAX_SECONDS, 1) * 100}%` },
                ]}
              />
            </View>
          )}

          <View style={v.topRow}>
            <Pressable
              onPress={requestClose}
              accessibilityRole="button"
              accessibilityLabel="Close camera"
              style={v.roundBtn}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>

            {phase !== "ready" ? (
              <View style={v.timerPill}>
                {phase === "recording" && <View style={v.recDot} />}
                <Text style={v.timerText}>{fmtDur(secs)}</Text>
              </View>
            ) : (
              <View style={v.timerPill}>
                <Text style={v.timerText}>
                  {front ? "Front camera" : "Back camera"}
                </Text>
              </View>
            )}

            <Pressable
              onPress={() => !front && setFlash((f) => !f)}
              accessibilityRole="button"
              accessibilityLabel="Toggle flash"
              style={[
                v.roundBtn,
                (front || phase === "review") && { opacity: 0.35 },
              ]}
            >
              <Ionicons
                name={flash ? "flash" : "flash-off"}
                size={20}
                color="#fff"
              />
            </Pressable>
          </View>
        </View>

        <View
          style={[v.bottom, { paddingBottom: Math.max(insets.bottom, 18) + 8 }]}
        >
          {phase === "review" ? (
            <>
              <Text style={v.hint}>Video bhejne se pehle check kar lo</Text>
              <View style={v.reviewRow}>
                <Pressable
                  onPress={retake}
                  accessibilityRole="button"
                  accessibilityLabel="Retake video"
                  style={v.retakeBtn}
                >
                  <Ionicons name="refresh" size={18} color="#fff" />
                  <Text style={v.retakeText}>Retake</Text>
                </Pressable>

                <Pressable
                  onPress={() => onSend(secs)}
                  accessibilityRole="button"
                  accessibilityLabel="Send video"
                  style={v.sendBtn}
                >
                  <Ionicons name="send" size={17} color="#fff" />
                  <Text style={v.sendText}>Send</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={v.hint}>
                {phase === "recording"
                  ? "Recording… rokne ke liye tap karo"
                  : `Record karne ke liye tap karo · max ${MAX_SECONDS}s`}
              </Text>
              <View style={v.controls}>
                <View style={v.side} />

                <Pressable
                  onPress={phase === "recording" ? stop : start}
                  accessibilityRole="button"
                  accessibilityLabel={
                    phase === "recording" ? "Stop recording" : "Start recording"
                  }
                  style={v.ring}
                >
                  <View
                    style={phase === "recording" ? v.stopSquare : v.recCircle}
                  />
                </Pressable>

                <View style={v.side}>
                  {phase === "ready" && (
                    <Pressable
                      onPress={() => {
                        setFront((f) => !f);
                        setFlash(false);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Flip camera"
                      style={v.roundBtn}
                    >
                      <Ionicons
                        name="camera-reverse-outline"
                        size={24}
                        color="#fff"
                      />
                    </Pressable>
                  )}
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const v = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  finder: {
    backgroundColor: "#0B0F1A",
    alignItems: "center",
    justifyContent: "center",
  },
  dim: { backgroundColor: "rgba(0,0,0,0.35)" },
  gridV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  gridH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  reviewPlay: {
    position: "absolute",
    alignSelf: "center",
    top: "45%",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  top: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 16,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 12,
    overflow: "hidden",
  },
  progressFill: { height: 3, backgroundColor: DANGER },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roundBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  recDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: DANGER },
  timerText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: "#fff",
    includeFontPadding: false,
  },

  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  hint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 16,
    textAlign: "center",
    includeFontPadding: false,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "stretch",
  },
  side: { width: 60, alignItems: "center", justifyContent: "center" },
  ring: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  recCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: DANGER,
  },
  stopSquare: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: DANGER,
  },

  reviewRow: {
    flexDirection: "row",
    gap: 12,
    alignSelf: "stretch",
  },
  retakeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  retakeText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: "#fff",
    includeFontPadding: false,
  },
  sendBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  sendText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: "#fff",
    includeFontPadding: false,
  },
});
