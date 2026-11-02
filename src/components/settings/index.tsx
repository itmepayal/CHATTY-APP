import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BG,
  DANGER,
  IconName,
  LINE,
  MUTED,
  SURFACE,
  TEXT,
  Tint,
  colors,
  fonts,
  radius,
  space,
} from "../ui";

/* ------------------------------ hooks ------------------------------ */

/** Shows a "saved" flag for a couple of seconds (UI-only feedback). */
export function useFlash(ms = 2400) {
  const [on, setOn] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback(() => {
    setOn(true);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setOn(false), ms);
  }, [ms]);
  useEffect(
    () => () => {
      if (t.current) clearTimeout(t.current);
    },
    [],
  );
  return [on, show] as const;
}

export function Page({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <View style={s.root}>
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        <View style={s.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [
              s.back,
              pressed && { backgroundColor: LINE },
            ]}
          >
            <Ionicons name="arrow-back" size={20} color={TEXT} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.title} numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? (
              <Text style={s.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={s.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {footer ? <View style={s.footer}>{footer}</View> : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={s.card}>{children}</View>;
}

export function Divider() {
  return <View style={s.divider} />;
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={s.sectionLabel}>{children}</Text>;
}

export function Body({ children }: { children: React.ReactNode }) {
  return <Text style={s.body}>{children}</Text>;
}

/* ------------------------------ rows ------------------------------ */

function IconBox({ icon, tint }: { icon: IconName; tint: Tint }) {
  return (
    <View style={[s.iconBox, { backgroundColor: tint[0] }]}>
      <Ionicons name={icon} size={18} color={tint[1]} />
    </View>
  );
}

export function NavRow({
  icon,
  tint,
  label,
  sub,
  value,
  danger,
  onPress,
  last,
}: {
  icon: IconName;
  tint: Tint;
  label: string;
  sub?: string;
  value?: string;
  danger?: boolean;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}${sub ? `. ${sub}` : ""}${value ? `. ${value}` : ""}`}
        style={({ pressed }) => [s.row, pressed && { backgroundColor: BG }]}
      >
        <IconBox icon={icon} tint={tint} />
        <View style={s.rowBody}>
          <Text
            style={[s.rowLabel, danger && { color: DANGER }]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {sub ? (
            <Text style={s.rowSub} numberOfLines={2}>
              {sub}
            </Text>
          ) : null}
        </View>
        {value ? <Text style={s.rowValue}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={15} color={MUTED} />
      </Pressable>
      {!last && <Divider />}
    </>
  );
}

export function ToggleRow({
  icon,
  tint,
  label,
  sub,
  value,
  onValueChange,
  last,
}: {
  icon?: IconName;
  tint?: Tint;
  label: string;
  sub?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <>
      <View style={s.row}>
        {icon && tint ? <IconBox icon={icon} tint={tint} /> : null}
        <View style={s.rowBody}>
          <Text style={s.rowLabel}>{label}</Text>
          {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: LINE, true: colors.primary }}
          thumbColor="#fff"
          accessibilityLabel={label}
        />
      </View>
      {!last && <Divider />}
    </>
  );
}

export function OptionRow({
  label,
  sub,
  selected,
  onPress,
  last,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <>
      <Pressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={label}
        style={({ pressed }) => [s.row, pressed && { backgroundColor: BG }]}
      >
        <View style={s.rowBody}>
          <Text style={s.rowLabel}>{label}</Text>
          {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
        </View>
        <View style={[s.radio, selected && { borderColor: colors.primary }]}>
          {selected && <View style={s.radioDot} />}
        </View>
      </Pressable>
      {!last && <Divider />}
    </>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={s.segment}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[s.segItem, on && s.segItemOn]}
          >
            <Text style={[s.segText, on && { color: colors.primary }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------ inputs ------------------------------ */

export function Field({
  label,
  error,
  hint,
  secure,
  ...rest
}: {
  label: string;
  error?: string;
  hint?: string;
  secure?: boolean;
} & TextInputProps) {
  const [hidden, setHidden] = useState(!!secure);
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View
        style={[
          s.input,
          focus && { borderColor: colors.primary },
          !!error && { borderColor: DANGER },
        ]}
      >
        <TextInput
          {...rest}
          secureTextEntry={secure && hidden}
          placeholderTextColor={MUTED}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          accessibilityLabel={label}
          style={[
            s.inputText,
            rest.multiline && {
              minHeight: 84,
              textAlignVertical: "top",
              paddingTop: 12,
            },
          ]}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={19}
              color={MUTED}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={s.error}>{error}</Text>
      ) : hint ? (
        <Text style={s.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "danger" | "ghost";
  icon?: IconName;
  disabled?: boolean;
}) {
  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
        ? DANGER
        : SURFACE;
  const fg = variant === "ghost" ? TEXT : "#fff";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: bg },
        variant === "ghost" && { borderWidth: 1, borderColor: LINE },
        disabled && { opacity: 0.45 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={17} color={fg} /> : null}
      <Text style={[s.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------ banner ------------------------------ */

const TONES = {
  info: { bg: "#EDE9FE", fg: "#5B21B6", icon: "information-circle" },
  success: { bg: "#D1FAE5", fg: "#047857", icon: "checkmark-circle" },
  warn: { bg: "#FEF3C7", fg: "#B45309", icon: "warning" },
  danger: { bg: "#FEE2E2", fg: "#B91C1C", icon: "alert-circle" },
} as const;

export function Banner({
  tone = "info",
  text,
}: {
  tone?: keyof typeof TONES;
  text: string;
}) {
  const t = TONES[tone];
  return (
    <View
      style={[s.banner, { backgroundColor: t.bg }]}
      accessibilityRole="alert"
    >
      <Ionicons name={t.icon as IconName} size={18} color={t.fg} />
      <Text style={[s.bannerText, { color: t.fg }]}>{text}</Text>
    </View>
  );
}

/* ------------------------------ styles ------------------------------ */

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: space.screen,
    paddingVertical: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 19,
    lineHeight: 26,
    color: TEXT,
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
    includeFontPadding: false,
  },
  content: {
    paddingHorizontal: space.screen,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  footer: {
    paddingHorizontal: space.screen,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE,
    backgroundColor: BG,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: radius.card,
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
    marginLeft: 64,
  },
  sectionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: MUTED,
    marginBottom: -6,
    marginLeft: 4,
    includeFontPadding: false,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: MUTED,
    includeFontPadding: false,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
    includeFontPadding: false,
  },
  rowSub: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: MUTED,
    includeFontPadding: false,
  },
  rowValue: {
    fontFamily: fonts.regular,
    fontSize: 12,
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
  segment: {
    flexDirection: "row",
    backgroundColor: BG,
    borderRadius: radius.pill,
    padding: 4,
    margin: 12,
  },
  segItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  segItemOn: {
    backgroundColor: SURFACE,
    shadowColor: "#0B0733",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: MUTED,
    includeFontPadding: false,
  },
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 18,
    color: TEXT,
    includeFontPadding: false,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
    paddingHorizontal: 14,
  },
  inputText: {
    flex: 1,
    minHeight: 48,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: TEXT,
    includeFontPadding: false,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: DANGER,
    includeFontPadding: false,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: MUTED,
    includeFontPadding: false,
  },
  button: {
    height: 50,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    fontFamily: fonts.semiBold,
    fontSize: 14.5,
    lineHeight: 20,
    includeFontPadding: false,
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 14,
  },
  bannerText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 18,
    includeFontPadding: false,
  },
});
