import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  IconName,
  Text,
  SURFACE,
  TEXT_2,
  MUTED,
  LINE,
  colors,
  fonts,
} from "../ui";

type CatKey =
  | "recent"
  | "smileys"
  | "gestures"
  | "hearts"
  | "nature"
  | "objects";

const CATEGORIES: { key: CatKey; icon: IconName; label: string }[] = [
  { key: "recent", icon: "time-outline", label: "Recent" },
  { key: "smileys", icon: "happy-outline", label: "Smileys" },
  { key: "gestures", icon: "hand-right-outline", label: "Gestures" },
  { key: "hearts", icon: "heart-outline", label: "Hearts" },
  { key: "nature", icon: "paw-outline", label: "Nature & food" },
  { key: "objects", icon: "bulb-outline", label: "Objects" },
];

const DATA: Record<Exclude<CatKey, "recent">, string[]> = {
  smileys: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😝",
    "🤑",
    "🤗",
    "🤭",
    "🤫",
    "🤔",
    "🤐",
    "🤨",
    "😐",
    "😑",
    "😶",
    "😏",
    "😒",
    "🙄",
    "😬",
    "🤥",
    "😎",
    "🤓",
    "🥳",
    "😴",
    "😢",
    "😭",
    "😤",
    "😡",
    "🤯",
    "😱",
    "😳",
    "🥺",
    "😔",
    "😞",
    "😟",
    "😕",
  ],
  gestures: [
    "👍",
    "👎",
    "👌",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "👇",
    "☝️",
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🖖",
    "👏",
    "🙌",
    "👐",
    "🤲",
    "🤝",
    "🙏",
    "💪",
    "✍️",
    "💅",
    "🤳",
    "👀",
    "👂",
    "👃",
    "🧠",
  ],
  hearts: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
    "💟",
    "✨",
    "🔥",
    "💯",
    "💥",
    "💫",
    "⭐",
    "🌟",
    "🎉",
    "🎊",
    "🎈",
    "🎂",
    "🎁",
    "🌈",
  ],
  nature: [
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
    "🐵",
    "🐔",
    "🐧",
    "🐦",
    "🦋",
    "🌸",
    "🌹",
    "🌻",
    "🌴",
    "🌞",
    "🍎",
    "🍌",
    "🍉",
    "🍇",
    "🍓",
    "🍕",
    "🍔",
    "🍟",
    "🌭",
    "🍿",
    "🍩",
    "🍪",
    "☕",
    "🍺",
    "🥤",
    "🍫",
  ],
  objects: [
    "⚽",
    "🏀",
    "🏈",
    "⚾",
    "🎾",
    "🏏",
    "🎮",
    "🎯",
    "🎲",
    "🎸",
    "🎤",
    "🎧",
    "🎬",
    "📷",
    "📱",
    "💻",
    "⌚",
    "💡",
    "📚",
    "✏️",
    "📌",
    "🔑",
    "🏆",
    "🚗",
    "✈️",
    "🏠",
    "⏰",
    "💰",
    "📞",
    "✉️",
    "🔔",
    "🔒",
  ],
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

type Props = {
  recent: string[];
  /** composer ka current text, upar ek chhota preview dikhane ke liye */
  preview?: string;
  onPick: (emoji: string) => void;
  onBackspace: () => void;
};

export default function EmojiPicker({
  recent,
  preview,
  onPick,
  onBackspace,
}: Props) {
  const [cat, setCat] = useState<CatKey>(recent.length ? "recent" : "smileys");

  const list = useMemo(
    () => (cat === "recent" ? recent : DATA[cat]),
    [cat, recent],
  );

  return (
    <View>
      {/* Typed text preview */}
      <View style={s.previewRow}>
        <Text
          style={[s.previewText, !preview && { color: MUTED }]}
          numberOfLines={1}
        >
          {preview || "Emoji chuno, message me add ho jayega"}
        </Text>
        <Pressable
          onPress={onBackspace}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Delete last character"
          style={s.backBtn}
        >
          <Ionicons name="backspace-outline" size={20} color={TEXT_2} />
        </Pressable>
      </View>

      {/* Category tabs */}
      <View style={s.tabs}>
        {CATEGORIES.map((c) => {
          const on = c.key === cat;
          const disabled = c.key === "recent" && recent.length === 0;
          return (
            <Pressable
              key={c.key}
              onPress={() => !disabled && setCat(c.key)}
              accessibilityRole="tab"
              accessibilityLabel={c.label}
              accessibilityState={{ selected: on, disabled }}
              style={[s.tab, on && s.tabOn, disabled && { opacity: 0.3 }]}
            >
              <Ionicons
                name={c.icon}
                size={19}
                color={on ? colors.primary : MUTED}
              />
            </Pressable>
          );
        })}
      </View>

      {/* Grid */}
      <ScrollView
        style={{ maxHeight: 250 }}
        contentContainerStyle={s.grid}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {list.map((e, i) => (
          <Pressable
            key={`${e}-${i}`}
            onPress={() => onPick(e)}
            accessibilityRole="button"
            accessibilityLabel={`Emoji ${e}`}
            style={({ pressed }) => [
              s.cell,
              pressed && { backgroundColor: SURFACE },
            ]}
          >
            <Text style={s.emoji}>{e}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 12,
    marginBottom: 10,
    paddingLeft: 14,
    paddingRight: 8,
    height: 44,
    borderRadius: 14,
    backgroundColor: SURFACE,
  },
  previewText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: "#111827",
    includeFontPadding: false,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 6,
    marginBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LINE,
  },
  tab: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabOn: { borderBottomColor: colors.primary },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  cell: {
    width: `${100 / 8}%`,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 25, lineHeight: 32 },
});
