import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  IconName,
  Text,
  TextInput,
  SURFACE,
  TEXT,
  TEXT_2,
  MUTED,
  LINE,
  colors,
  fonts,
} from "../ui";

const USE_MOCK = true;
const API_BASE = "https://your-api.com/api";

export type AiMode = "correct" | "rewrite" | "hinglish";

export const TONES = [
  { key: "professional", label: "Professional", emoji: "💼" },
  { key: "friendly", label: "Friendly", emoji: "😊" },
  { key: "casual", label: "Casual", emoji: "😎" },
  { key: "formal", label: "Formal", emoji: "🎩" },
  { key: "polite", label: "Polite", emoji: "🙏" },
  { key: "confident", label: "Confident", emoji: "💪" },
] as const;

type ToneKey = (typeof TONES)[number]["key"];

const MODES: {
  key: AiMode;
  label: string;
  short: string;
  icon: IconName;
  hint: string;
  cta: string;
}[] = [
  {
    key: "correct",
    label: "Fix grammar",
    short: "Fix",
    icon: "checkmark-done",
    hint: "Spelling, grammar aur punctuation theek karta hai",
    cta: "Fix my text",
  },
  {
    key: "rewrite",
    label: "Rewrite",
    short: "Rewrite",
    icon: "create-outline",
    hint: "Apne pasand ke tone me dobara likhta hai",
    cta: "Rewrite",
  },
  {
    key: "hinglish",
    label: "Hinglish → English",
    short: "Hinglish",
    icon: "language",
    hint: "Hinglish ko saaf English me translate karta hai",
    cta: "Translate to English",
  },
];

async function callAi(
  mode: AiMode,
  text: string,
  tone: ToneKey,
  token?: string,
): Promise<string> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1100));
    if (mode === "correct") {
      const fixed = text
        .replace(/\bi\b/g, "I")
        .replace(/\bdont\b/gi, "don't")
        .replace(/\bcant\b/gi, "can't")
        .replace(/\s+/g, " ")
        .trim();
      const cap = fixed.charAt(0).toUpperCase() + fixed.slice(1);
      return /[.!?]$/.test(cap) ? cap : `${cap}.`;
    }
    if (mode === "rewrite") {
      const base = text.trim().replace(/[.!?]+$/, "");
      const map: Record<ToneKey, string> = {
        professional: `I wanted to let you know: ${base}. Please confirm at your convenience.`,
        friendly: `Hey! Just a quick note, ${base} 😊`,
        casual: `So yeah, ${base.toLowerCase()}.`,
        formal: `I would like to inform you that ${base.toLowerCase()}.`,
        polite: `Would you kindly consider this: ${base}? Thank you so much 🙏`,
        confident: `Here's the plan: ${base}. Let's make it happen.`,
      };
      return map[tone];
    }
    return `Translation: ${text.trim()} (English)`;
  }

  const body: Record<string, string> = { text };
  if (mode === "rewrite") body.tone = tone;

  const res = await fetch(`${API_BASE}/ai/${mode}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = await res.json();

  // Response key aapke backend ke hisaab se adjust karo
  const out =
    data?.result ??
    data?.corrected ??
    data?.rewritten ??
    data?.translated ??
    data?.text;
  if (typeof out !== "string" || !out.trim()) throw new Error("Empty response");
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

type Props = {
  initialText?: string;
  initialMode?: AiMode;
  onApply: (text: string) => void;
  onCopy?: (text: string) => void;
  authToken?: string;
};

export default function AiAssistSheet({
  initialText = "",
  initialMode = "correct",
  onApply,
  onCopy,
  authToken,
}: Props) {
  const [mode, setMode] = useState<AiMode>(initialMode);
  const [input, setInput] = useState(initialText);
  const [tone, setTone] = useState<ToneKey>("friendly");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reqId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const current = MODES.find((m) => m.key === mode)!;
  const canRun = !!input.trim() && !loading;
  const unchanged =
    result !== null && result.trim() === input.trim() && mode === "correct";

  const run = useCallback(async () => {
    const t = input.trim();
    if (!t) return;
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const out = await callAi(mode, t, tone, authToken);
      if (!mounted.current || id !== reqId.current) return;
      setResult(out.trim());
    } catch (e: any) {
      if (!mounted.current || id !== reqId.current) return;
      setError(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      if (mounted.current && id === reqId.current) setLoading(false);
    }
  }, [input, mode, tone, authToken]);

  const switchMode = (m: AiMode) => {
    if (m === mode) return;
    reqId.current++; // purane request ka result ignore
    setMode(m);
    setResult(null);
    setError(null);
    setLoading(false);
  };

  return (
    <View>
      {/* Title */}
      <View style={s.titleRow}>
        <View style={s.titleIcon}>
          <Ionicons name="sparkles" size={15} color={colors.primary} />
        </View>
        <Text style={s.title}>AI Assist</Text>
      </View>

      {/* Mode tabs */}
      <View style={s.tabs}>
        {MODES.map((m) => {
          const on = m.key === mode;
          return (
            <Pressable
              key={m.key}
              onPress={() => switchMode(m.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={m.label}
              style={[s.tab, on && s.tabOn]}
            >
              <Ionicons
                name={m.icon}
                size={15}
                color={on ? "#fff" : colors.primary}
              />
              <Text style={[s.tabText, on && { color: "#fff" }]}>
                {m.short}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={s.hint}>{current.hint}</Text>

      {/* Input */}
      <View style={s.inputBox}>
        <TextInput
          value={input}
          onChangeText={(v) => {
            setInput(v);
            if (result || error) {
              setResult(null);
              setError(null);
            }
          }}
          placeholder={
            mode === "hinglish"
              ? "Jaise: Kal meeting 4 baje hai, please aa jana"
              : "Apna message yahan likho ya paste karo"
          }
          placeholderTextColor={MUTED}
          multiline
          style={s.input}
          accessibilityLabel="Text for AI"
        />
        {!!input && (
          <Pressable
            onPress={() => {
              setInput("");
              setResult(null);
              setError(null);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear text"
            style={s.clearBtn}
          >
            <Ionicons name="close-circle" size={18} color={MUTED} />
          </Pressable>
        )}
      </View>

      {/* Tone chips (rewrite only) */}
      {mode === "rewrite" && (
        <View style={{ marginTop: 10 }}>
          <Text style={s.label}>Tone</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chips}
            keyboardShouldPersistTaps="handled"
          >
            {TONES.map((t) => {
              const on = t.key === tone;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => {
                    setTone(t.key);
                    setResult(null);
                    setError(null);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  style={[s.chip, on && s.chipOn]}
                >
                  <Text style={s.chipEmoji}>{t.emoji}</Text>
                  <Text style={[s.chipText, on && { color: colors.primary }]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Run button */}
      <Pressable
        onPress={canRun ? run : undefined}
        accessibilityRole="button"
        accessibilityLabel={current.cta}
        accessibilityState={{ disabled: !canRun }}
        style={({ pressed }) => [
          s.runBtn,
          !canRun && { opacity: 0.4 },
          pressed && canRun && { transform: [{ scale: 0.98 }] },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="sparkles" size={16} color="#fff" />
        )}
        <Text style={s.runText}>{loading ? "Thinking…" : current.cta}</Text>
      </Pressable>

      {/* Error */}
      {!!error && (
        <View style={s.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#DC2626" />
          <Text style={s.errorText}>{error}</Text>
          <Pressable
            onPress={run}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Text style={s.retry}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Result */}
      {result !== null && !error && (
        <View style={s.resultBox}>
          <View style={s.resultHead}>
            <Ionicons
              name={unchanged ? "checkmark-circle" : "sparkles"}
              size={14}
              color={unchanged ? "#059669" : colors.primary}
            />
            <Text style={[s.resultLabel, unchanged && { color: "#059669" }]}>
              {unchanged
                ? "Sab theek hai, koi change nahi chahiye"
                : mode === "correct"
                  ? "Corrected"
                  : mode === "rewrite"
                    ? `Rewritten · ${TONES.find((t) => t.key === tone)?.label}`
                    : "English"}
            </Text>
          </View>

          <Text style={s.resultText} selectable>
            {result}
          </Text>

          <View style={s.resultActions}>
            <Pressable
              onPress={run}
              accessibilityRole="button"
              accessibilityLabel="Try again"
              style={s.ghostBtn}
            >
              <Ionicons name="refresh" size={15} color={colors.primary} />
              <Text style={s.ghostText}>Try again</Text>
            </Pressable>

            {!!onCopy && (
              <Pressable
                onPress={() => onCopy(result)}
                accessibilityRole="button"
                accessibilityLabel="Copy result"
                style={s.ghostBtn}
              >
                <Ionicons
                  name="copy-outline"
                  size={15}
                  color={colors.primary}
                />
                <Text style={s.ghostText}>Copy</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => onApply(result)}
              accessibilityRole="button"
              accessibilityLabel="Use this text"
              style={s.useBtn}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={s.useText}>Use this</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const s = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  titleIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
    includeFontPadding: false,
  },

  tabs: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#EEF0FF",
  },
  tabOn: { backgroundColor: colors.primary },
  tabText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 17,
    color: colors.primary,
    includeFontPadding: false,
  },
  hint: {
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 10,
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: MUTED,
    includeFontPadding: false,
  },

  inputBox: {
    marginHorizontal: 12,
    minHeight: 84,
    maxHeight: 150,
    paddingHorizontal: 14,
    paddingRight: 36,
    borderRadius: 16,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
    color: TEXT,
    paddingVertical: 12,
    includeFontPadding: false,
  },
  clearBtn: { position: "absolute", right: 10, top: 10 },

  label: {
    marginHorizontal: 14,
    marginBottom: 6,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    lineHeight: 15,
    color: TEXT_2,
    includeFontPadding: false,
  },
  chips: { paddingHorizontal: 12, gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  chipOn: { backgroundColor: "#EEF0FF", borderColor: colors.primary },
  chipEmoji: { fontSize: 14, lineHeight: 19 },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: TEXT_2,
    includeFontPadding: false,
  },

  runBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    marginTop: 14,
    marginHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  runText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: "#fff",
    includeFontPadding: false,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: "#991B1B",
    includeFontPadding: false,
  },
  retry: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 17,
    color: "#DC2626",
    includeFontPadding: false,
  },

  resultBox: {
    marginHorizontal: 12,
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#F5F6FF",
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  resultHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  resultLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    lineHeight: 15,
    color: colors.primary,
    includeFontPadding: false,
  },
  resultText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: TEXT,
    includeFontPadding: false,
  },
  resultActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  ghostBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  ghostText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 17,
    color: colors.primary,
    includeFontPadding: false,
  },
  useBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  useText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: "#fff",
    includeFontPadding: false,
  },
});
