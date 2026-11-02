import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { alpha, useTheme } from "../../theme/theme";
import {
  defaultTheme,
  themeNames,
  themes,
  ThemeName,
} from "../../theme/themes";
import { Text, fonts, usePalette, UiPalette } from "../../components/ui";
import {
  Gap,
  HeaderPill,
  ScreenHeader,
  Segmented,
  Setting,
  SectionTitle,
  SettingsGroup,
  ToggleRow,
  useSettingsStyles,
} from "../../components/settings/settings";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FontSize = "small" | "medium" | "large";
type Bubble = "round" | "soft" | "sharp";
type Spacing = "cozy" | "compact";
type TimeFormat = "12h" | "24h";
type Filter = "all" | "light" | "dark";

export type Appearance = {
  fontSize: FontSize;
  bubble: Bubble;
  spacing: Spacing;
  timestamps: boolean;
  timeFormat: TimeFormat;
};

export const APPEARANCE_DEFAULTS: Appearance = {
  fontSize: "medium",
  bubble: "round",
  spacing: "cozy",
  timestamps: true,
  timeFormat: "12h",
};

const STORAGE_KEY = "app-appearance";
const COLLAPSED_COUNT = 6;

export const FONT_PX: Record<FontSize, number> = {
  small: 12.5,
  medium: 14,
  large: 16.5,
};
export const BUBBLE_R: Record<Bubble, number> = {
  round: 18,
  soft: 10,
  sharp: 3,
};
export const GAP: Record<Spacing, number> = { cozy: 10, compact: 4 };
const PREVIEW_FONT_SCALE = 0.78;
const PREVIEW_RADIUS_SCALE = 0.75;
const PREVIEW_GAP_SCALE = 0.7;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const yiq = (hex: string) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
};
const isDarkHex = (hex: string) => yiq(hex) < 128;
const readableOn = (hex: string) => (yiq(hex) >= 150 ? "#0F172A" : "#FFFFFF");

const fmtTime = (h: number, m: number, f: TimeFormat) => {
  const mm = String(m).padStart(2, "0");
  if (f === "24h") return `${String(h).padStart(2, "0")}:${mm}`;
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${mm} ${h >= 12 ? "PM" : "AM"}`;
};

export function useAppearance() {
  const [state, setState] = useState<Appearance>(APPEARANCE_DEFAULTS);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && raw)
          setState({ ...APPEARANCE_DEFAULTS, ...JSON.parse(raw) });
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, []);

  const update = useCallback(
    <K extends keyof Appearance>(k: K, v: Appearance[K]) => {
      setState((prev) => {
        const next = { ...prev, [k]: v };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setState(APPEARANCE_DEFAULTS);
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(APPEARANCE_DEFAULTS),
    ).catch(() => {});
  }, []);

  return [state, update, reset] as const;
}

type Styles = ReturnType<typeof makeStyles>;

/* ------------------------------------------------------------------ */
/* Theme card                                                          */
/* ------------------------------------------------------------------ */

function ThemeCard({
  name,
  selected,
  width,
  onPress,
  p,
  s,
}: {
  name: ThemeName;
  selected: boolean;
  width: number;
  onPress: () => void;
  p: UiPalette;
  s: Styles;
}) {
  const c = themes[name];
  const dark = isDarkHex(c.background);
  const scale = useRef(new Animated.Value(1)).current;
  const sel = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(sel, {
      toValue: selected ? 1 : 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [selected, sel]);

  const press = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0,
    }).start();

  return (
    <Animated.View style={{ width, transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => press(0.97)}
        onPressOut={() => press(1)}
        accessibilityRole="button"
        accessibilityLabel={`${cap(name)} theme, ${dark ? "dark" : "light"}`}
        accessibilityState={{ selected }}
        style={[s.card, selected && s.cardOn]}
      >
        <View
          style={[
            s.mock,
            { backgroundColor: c.background, borderColor: c.border },
          ]}
        >
          <View style={s.mockHead}>
            <View style={[s.mockAvatar, { backgroundColor: c.primary }]} />
            <View style={{ flex: 1, gap: 3 }}>
              <View
                style={[
                  s.mockLine,
                  { width: "58%", backgroundColor: c.text, opacity: 0.8 },
                ]}
              />
              <View
                style={[
                  s.mockLine,
                  { width: "34%", backgroundColor: c.muted, opacity: 0.7 },
                ]}
              />
            </View>
            <View style={[s.mockDot, { backgroundColor: c.online }]} />
          </View>
          <View
            style={[
              s.mockBubble,
              {
                width: "64%",
                backgroundColor: c.messageReceived,
                borderWidth: 1,
                borderColor: c.border,
              },
            ]}
          />
          <View
            style={[
              s.mockBubble,
              {
                width: "50%",
                alignSelf: "flex-end",
                backgroundColor: c.messageSent,
              },
            ]}
          />
        </View>

        <View style={s.cardFoot}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={[s.cardName, selected && { fontFamily: fonts.semiBold }]}
              numberOfLines={1}
            >
              {cap(name)}
            </Text>
            <View style={s.cardModeRow}>
              <Ionicons
                name={dark ? "moon" : "sunny"}
                size={10}
                color={p.muted}
              />
              <Text style={s.cardMode}>{dark ? "Dark" : "Light"}</Text>
            </View>
          </View>
          <View style={s.checkOff}>
            <Animated.View
              style={[s.checkOn, { opacity: sel, transform: [{ scale: sel }] }]}
            >
              <Ionicons name="checkmark" size={11} color={p.onPrimary} />
            </Animated.View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Live preview — phone-frame UI, smaller type                         */
/* ------------------------------------------------------------------ */

const MESSAGES = [
  { id: 1, mine: false, text: "Hey! How are you feeling today?", h: 14, m: 30 },
  {
    id: 2,
    mine: true,
    text: "Did you drink enough water today?",
    h: 14,
    m: 30,
  },
  {
    id: 3,
    mine: false,
    text: "Remember to take a short walk or stretch!",
    h: 14,
    m: 31,
  },
  { id: 4, mine: true, text: "How was your sleep last night?", h: 14, m: 32 },
];

function Preview({ a, s }: { a: Appearance; s: Styles }) {
  const { colors: c } = useTheme();
  const r = Math.round(BUBBLE_R[a.bubble] * PREVIEW_RADIUS_SCALE);
  const tail = Math.min(r, 3);
  const fs = FONT_PX[a.fontSize] * PREVIEW_FONT_SCALE;
  const gap = Math.round(GAP[a.spacing] * PREVIEW_GAP_SCALE);
  const onSent = readableOn(c.messageSent);

  const theirsStyle = {
    backgroundColor: c.messageReceived,
    borderColor: c.border,
    borderRadius: r,
    borderBottomLeftRadius: tail,
  };
  const mineStyle = {
    backgroundColor: c.messageSent,
    borderRadius: r,
    borderBottomRightRadius: tail,
  };

  return (
    <View style={s.stage}>
      <View style={s.phone}>
        <View style={s.notch} />

        {/* Screen */}
        <View style={[s.screen, { backgroundColor: c.background }]}>
          {/* Compact header */}
          <View style={[s.pHeader, { borderBottomColor: c.border }]}>
            <Ionicons name="chevron-back" size={15} color={c.text} />
            <View
              style={[s.pAvatar, { backgroundColor: alpha(c.primary, 0.18) }]}
            >
              <Text style={[s.pAvatarText, { color: c.primary }]}>J</Text>
              <View
                style={[
                  s.pOnline,
                  { backgroundColor: c.online, borderColor: c.background },
                ]}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[s.pName, { color: c.text }]} numberOfLines={1}>
                John Duo
              </Text>
              <Text style={[s.pStatus, { color: c.online }]}>Online</Text>
            </View>
            <Ionicons name="call-outline" size={14} color={c.muted} />
            <Ionicons name="ellipsis-vertical" size={14} color={c.muted} />
          </View>

          {/* Messages */}
          <View style={[s.pBody, { gap }]}>
            <View
              style={[s.pDayChip, { backgroundColor: alpha(c.muted, 0.16) }]}
            >
              <Text style={[s.pDayText, { color: c.muted }]}>Today</Text>
            </View>

            {MESSAGES.map((m) => {
              const time = a.timestamps
                ? fmtTime(m.h, m.m, a.timeFormat)
                : null;
              return (
                <View
                  key={m.id}
                  style={[
                    s.pBubble,
                    m.mine ? s.pBubbleMine : s.pBubbleTheirs,
                    m.mine ? mineStyle : theirsStyle,
                  ]}
                >
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: fs,
                      lineHeight: fs * 1.4,
                      color: m.mine ? onSent : c.text,
                    }}
                  >
                    {m.text}
                  </Text>
                  {time && (
                    <View style={s.pMeta}>
                      <Text
                        style={[
                          s.pMetaText,
                          { color: m.mine ? alpha(onSent, 0.75) : c.muted },
                        ]}
                      >
                        {time}
                      </Text>
                      {m.mine && (
                        <Ionicons
                          name="checkmark-done"
                          size={10}
                          color={alpha(onSent, 0.85)}
                        />
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Composer */}
          <View style={[s.pComposer, { borderTopColor: c.border }]}>
            <View style={[s.pInput, { backgroundColor: alpha(c.muted, 0.14) }]}>
              <Text
                style={[s.pInputText, { color: c.muted }]}
                numberOfLines={1}
              >
                Type a message
              </Text>
              <Ionicons name="attach-outline" size={14} color={c.muted} />
            </View>
            <View style={[s.pSend, { backgroundColor: c.primary }]}>
              <Ionicons name="send" size={11} color={readableOn(c.primary)} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function AppearanceScreen() {
  const p = usePalette();
  const ui = useSettingsStyles(); // shared: safe, content
  const s = useMemo(() => makeStyles(p), [p]); // local: grid, card, preview
  const { name, setTheme } = useTheme();
  const { width: W } = useWindowDimensions();
  const [a, update, reset] = useAppearance();

  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return themeNames;
    return themeNames.filter((n) => {
      const dark = isDarkHex(themes[n].background);
      return filter === "dark" ? dark : !dark;
    });
  }, [filter]);

  const visible = useMemo(() => {
    if (expanded || filtered.length <= COLLAPSED_COUNT) return filtered;
    const head = filtered.slice(0, COLLAPSED_COUNT);
    // the selected theme should always stay visible
    if (!head.includes(name) && filtered.includes(name)) {
      return [...head.slice(0, COLLAPSED_COUNT - 1), name];
    }
    return head;
  }, [filtered, expanded, name]);

  const cardW = Math.floor((W - 32 - 12) / 2);

  const animate = () =>
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const resetAll = () => {
    reset();
    setTheme(defaultTheme);
  };

  return (
    <SafeAreaView style={ui.safe} edges={["top"]}>
      <StatusBar style={p.isDarkBg ? "light" : "dark"} />

      <ScreenHeader
        icon="color-palette"
        title="Appearance"
        subtitle="Theme, text and bubbles"
        right={
          <HeaderPill
            icon="refresh"
            label="Reset"
            onPress={resetAll}
            accessibilityLabel="Reset appearance to defaults"
          />
        }
      />

      <ScrollView
        contentContainerStyle={ui.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview */}
        <SectionTitle
          title="Preview"
          icon="eye-outline"
          hint={`${cap(name)} theme`}
        />
        <Preview a={a} s={s} />

        {/* Theme */}
        <Gap />
        <SectionTitle
          title="Theme"
          icon="color-palette-outline"
          hint={`${filtered.length} available`}
        />
        <Segmented<Filter>
          value={filter}
          onChange={(v) => {
            animate();
            setFilter(v);
            setExpanded(false);
          }}
          options={[
            { value: "all", label: "All" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />

        <View style={s.grid}>
          {visible.map((n) => (
            <ThemeCard
              key={n}
              name={n}
              width={cardW}
              selected={n === name}
              onPress={() => setTheme(n)}
              p={p}
              s={s}
            />
          ))}
        </View>

        {filtered.length > COLLAPSED_COUNT && (
          <Pressable
            onPress={() => {
              animate();
              setExpanded((v) => !v);
            }}
            accessibilityRole="button"
            accessibilityLabel={
              expanded ? "Show fewer themes" : "Show all themes"
            }
            style={({ pressed }) => [s.moreBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={s.moreText}>
              {expanded ? "Show less" : `Show all ${filtered.length} themes`}
            </Text>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={14}
              color={p.primary}
            />
          </Pressable>
        )}

        {/* Messages */}
        <Gap />
        <SectionTitle title="Messages" icon="chatbubbles-outline" />
        <SettingsGroup>
          <Setting
            icon="text-outline"
            label="Font size"
            sub="Size of message text"
          >
            <Segmented<FontSize>
              value={a.fontSize}
              onChange={(v) => update("fontSize", v)}
              options={[
                { value: "small", label: "Small" },
                { value: "medium", label: "Medium" },
                { value: "large", label: "Large" },
              ]}
            />
          </Setting>

          <Setting
            icon="chatbubble-ellipses-outline"
            label="Bubble style"
            sub="Shape of message bubbles"
          >
            <Segmented<Bubble>
              value={a.bubble}
              onChange={(v) => update("bubble", v)}
              options={[
                { value: "round", label: "Round" },
                { value: "soft", label: "Soft" },
                { value: "sharp", label: "Sharp" },
              ]}
            />
          </Setting>

          <Setting
            icon="reorder-three-outline"
            label="Message spacing"
            sub="Gap between messages"
          >
            <Segmented<Spacing>
              value={a.spacing}
              onChange={(v) => update("spacing", v)}
              options={[
                { value: "cozy", label: "Cozy" },
                { value: "compact", label: "Compact" },
              ]}
            />
          </Setting>

          <ToggleRow
            icon="time-outline"
            label="Timestamps"
            sub="Show the time under each message"
            value={a.timestamps}
            onValueChange={(v) => {
              animate();
              update("timestamps", v);
            }}
            last={!a.timestamps}
          />

          {a.timestamps && (
            <Setting
              icon="timer-outline"
              label="Time format"
              sub="12-hour or 24-hour clock"
              last
            >
              <Segmented<TimeFormat>
                value={a.timeFormat}
                onChange={(v) => update("timeFormat", v)}
                options={[
                  { value: "12h", label: "12-hour" },
                  { value: "24h", label: "24-hour" },
                ]}
              />
            </Setting>
          )}
        </SettingsGroup>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Styles — only Appearance-specific (grid, cards, preview)            */
/* ------------------------------------------------------------------ */

const makeStyles = (p: UiPalette) =>
  StyleSheet.create({
    /* theme grid */
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginTop: 12,
    },
    card: {
      padding: 7,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: p.line,
      backgroundColor: p.card,
    },
    cardOn: { borderColor: p.primary },
    mock: {
      height: 84,
      borderRadius: 9,
      borderWidth: 1,
      padding: 7,
      gap: 5,
      overflow: "hidden",
    },
    mockHead: { flexDirection: "row", alignItems: "center", gap: 6 },
    mockAvatar: { width: 13, height: 13, borderRadius: 7 },
    mockLine: { height: 3, borderRadius: 2 },
    mockDot: { width: 5, height: 5, borderRadius: 3 },
    mockBubble: { height: 13, borderRadius: 7 },
    cardFoot: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      paddingHorizontal: 3,
      paddingBottom: 1,
    },
    cardName: {
      fontFamily: fonts.medium,
      fontSize: 12.5,
      lineHeight: 17,
      color: p.text,
      includeFontPadding: false,
    },
    cardModeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    cardMode: {
      fontFamily: fonts.regular,
      fontSize: 10.5,
      lineHeight: 14,
      color: p.muted,
      includeFontPadding: false,
    },
    checkOff: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      borderColor: p.line,
      alignItems: "center",
      justifyContent: "center",
    },
    checkOn: {
      position: "absolute",
      top: -1.5,
      left: -1.5,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: p.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    moreBtn: {
      marginTop: 12,
      height: 40,
      borderRadius: 12,
      backgroundColor: p.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    moreText: {
      fontFamily: fonts.medium,
      fontSize: 12.5,
      lineHeight: 17,
      color: p.primary,
      includeFontPadding: false,
    },

    /* preview: stage + phone frame */
    stage: {
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: alpha(p.primary, 0.08),
      borderWidth: 1,
      borderColor: alpha(p.primary, 0.18),
    },
    phone: {
      width: "86%",
      maxWidth: 300,
      borderRadius: 26,
      borderWidth: 5,
      borderColor: alpha(p.text, 0.85),
      backgroundColor: alpha(p.text, 0.85),
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },
    notch: {
      position: "absolute",
      top: 5,
      alignSelf: "center",
      width: 44,
      height: 9,
      borderRadius: 5,
      backgroundColor: alpha(p.text, 0.85),
      zIndex: 2,
    },
    screen: { borderRadius: 20, overflow: "hidden", paddingTop: 12 },
    pHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 8,
      paddingVertical: 7,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    pAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    pAvatarText: {
      fontFamily: fonts.semiBold,
      fontSize: 10,
      includeFontPadding: false,
    },
    pOnline: {
      position: "absolute",
      right: -1,
      bottom: -1,
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 1.5,
    },
    pName: {
      fontFamily: fonts.semiBold,
      fontSize: 11,
      lineHeight: 14,
      includeFontPadding: false,
    },
    pStatus: {
      fontFamily: fonts.regular,
      fontSize: 8.5,
      lineHeight: 11,
      includeFontPadding: false,
    },
    pBody: { paddingHorizontal: 9, paddingVertical: 10 },
    pDayChip: {
      alignSelf: "center",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    pDayText: {
      fontFamily: fonts.medium,
      fontSize: 8.5,
      lineHeight: 11,
      includeFontPadding: false,
    },
    pBubble: { paddingHorizontal: 9, paddingVertical: 5, maxWidth: "82%" },
    pBubbleMine: { alignSelf: "flex-end" },
    pBubbleTheirs: {
      alignSelf: "flex-start",
      borderWidth: StyleSheet.hairlineWidth * 2,
    },
    pMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      marginTop: 1,
      alignSelf: "flex-end",
    },
    pMetaText: {
      fontFamily: fonts.regular,
      fontSize: 8,
      lineHeight: 10,
      includeFontPadding: false,
    },
    pComposer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      padding: 7,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    pInput: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 28,
      paddingHorizontal: 10,
      borderRadius: 14,
    },
    pInputText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 10,
      includeFontPadding: false,
    },
    pSend: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
  });
