import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { IconName, Text, Tint, fonts } from "../ui";

export type CallContact = {
  name: string;
  type: "personal" | "group";
  online?: boolean;
  members?: number;
  icon?: IconName;
  tint: Tint;
};

export const CALL_CONTACTS: Record<string, CallContact> = {
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

export const CALL_FALLBACK: CallContact = {
  name: "Chat",
  type: "personal",
  tint: ["#E0E7FF", "#4338CA"],
};

export const CALL_BG = "#0B1020";
export const CALL_PRIMARY = "#4F46E5";
export const CALL_DANGER = "#EF4444";

export function useCallTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  return seconds;
}

export const fmtClock = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export function useCallNav(chatId: string) {
  const router = useRouter();
  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace(`/chat/${chatId}` as never);
  };
  return { router, leave };
}

export function CallButton({
  icon,
  label,
  active,
  danger,
  size = 60,
  onPress,
}: {
  icon: IconName;
  label?: string;
  active?: boolean;
  danger?: boolean;
  size?: number;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    Animated.spring(scale, {
      toValue: v,
      useNativeDriver: true,
      friction: 7,
      tension: 200,
    }).start();

  const bg = danger
    ? CALL_DANGER
    : active
      ? "#FFFFFF"
      : "rgba(255,255,255,0.14)";
  const fg = active && !danger ? CALL_BG : "#FFFFFF";

  return (
    <View style={s.btnWrap}>
      <Pressable
        onPress={onPress}
        onPressIn={() => to(0.9)}
        onPressOut={() => to(1)}
        accessibilityRole="button"
        accessibilityLabel={label ?? icon}
        accessibilityState={{ selected: !!active }}
      >
        <Animated.View
          style={[
            s.btn,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: bg,
              transform: [{ scale }],
            },
            danger && s.btnDangerShadow,
          ]}
        >
          <Ionicons name={icon} size={Math.round(size * 0.4)} color={fg} />
        </Animated.View>
      </Pressable>
      {!!label && <Text style={s.btnLabel}>{label}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  btnWrap: { alignItems: "center", gap: 8 },
  btn: { alignItems: "center", justifyContent: "center" },
  btnDangerShadow: {
    shadowColor: CALL_DANGER,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  btnLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.75)",
    includeFontPadding: false,
  },
});
