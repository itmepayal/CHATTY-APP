import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { alpha } from "../../theme/theme";
import { Text, fonts, usePalette, UiPalette } from "./../ui";

export type IconName = keyof typeof Ionicons.glyphMap;
export type Tint = readonly [string, string];
export type SettingsStyles = ReturnType<typeof makeSettingsStyles>;

export const DANGER = "#DC2626";
export const SUCCESS = "#16A34A";
export const WARN = "#D97706";
export const INFO = "#7C3AED";

export function useSettingsStyles() {
  const p = usePalette();
  return useMemo(() => makeSettingsStyles(p), [p]);
}

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

export function ScreenHeader({
  icon,
  title,
  subtitle,
  right,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  const p = usePalette();
  const s = useSettingsStyles();
  return (
    <View style={s.header}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="arrow-back" size={20} color={p.text} />
      </Pressable>

      {icon ? (
        <View style={s.headerIcon}>
          <Ionicons name={icon} size={20} color={p.primary} />
        </View>
      ) : null}

      <View style={s.headerText}>
        <Text
          style={s.headerTitle}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={s.headerSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right}
    </View>
  );
}

export function Page({
  title,
  subtitle,
  icon,
  right,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  right?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const s = useSettingsStyles();
  return (
    <View style={s.safe}>
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        <ScreenHeader
          icon={icon}
          title={title}
          subtitle={subtitle}
          right={right}
        />
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

export function HeaderPill({
  icon,
  label,
  color,
  onPress,
  accessibilityLabel,
}: {
  icon: IconName;
  label: string;
  color?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const p = usePalette();
  const s = useSettingsStyles();
  const c = color ?? p.primary;
  const body = (
    <>
      <Ionicons name={icon} size={13} color={c} />
      <Text style={[s.pillText, { color: c }]}>{label}</Text>
    </>
  );
  const bg = { backgroundColor: alpha(c, color ? 0.14 : 0.12) };

  if (!onPress) {
    return (
      <View
        style={[s.pill, bg]}
        accessibilityLabel={accessibilityLabel ?? label}
      >
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={8}
      style={({ pressed }) => [s.pill, bg, pressed && { opacity: 0.6 }]}
    >
      {body}
    </Pressable>
  );
}

export function SectionTitle({
  title,
  icon,
  hint,
  danger,
}: {
  title: string;
  icon: IconName;
  hint?: string;
  danger?: boolean;
}) {
  const p = usePalette();
  const s = useSettingsStyles();
  return (
    <View style={s.sectionRow}>
      <View style={s.sectionLeft}>
        <Ionicons name={icon} size={15} color={danger ? DANGER : p.primary} />
        <Text style={[s.sectionTitle, danger && { color: DANGER }]}>
          {title}
        </Text>
      </View>
      {!!hint && <Text style={s.sectionHint}>{hint}</Text>}
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  const s = useSettingsStyles();
  return <Text style={s.sectionLabel}>{children}</Text>;
}

export function Body({ children }: { children: React.ReactNode }) {
  const s = useSettingsStyles();
  return <Text style={s.body}>{children}</Text>;
}

export function Gap() {
  const s = useSettingsStyles();
  return <View style={s.gap} />;
}

export function Divider() {
  const s = useSettingsStyles();
  return <View style={s.divider} />;
}

export function SettingsGroup({
  danger,
  children,
}: {
  danger?: boolean;
  children: React.ReactNode;
}) {
  const s = useSettingsStyles();
  return <View style={[s.group, danger && s.groupDanger]}>{children}</View>;
}

export const Card = SettingsGroup;

export function IconTile({
  icon,
  danger,
  tint,
}: {
  icon: IconName;
  danger?: boolean;
  tint?: Tint;
}) {
  const p = usePalette();
  const s = useSettingsStyles();
  const color = tint ? tint[1] : danger ? DANGER : p.primary;
  const bg = tint ? tint[0] : alpha(color, 0.12);
  return (
    <View style={[s.iconTile, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
  );
}

export function Setting({
  icon,
  tint,
  label,
  sub,
  right,
  danger,
  last,
  onPress,
  accessibilityLabel,
  children,
}: {
  icon?: IconName;
  tint?: Tint;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  danger?: boolean;
  last?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  children?: React.ReactNode;
}) {
  const s = useSettingsStyles();
  const inner = (
    <>
      <View style={s.settingHead}>
        {icon ? <IconTile icon={icon} danger={danger} tint={tint} /> : null}
        <View style={s.settingText}>
          <Text style={[s.settingLabel, danger && { color: DANGER }]}>
            {label}
          </Text>
          {!!sub && <Text style={s.settingSub}>{sub}</Text>}
        </View>
        {right}
      </View>
      {children}
    </>
  );

  if (!onPress) {
    return <View style={[s.setting, !last && s.settingDivider]}>{inner}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        s.setting,
        !last && s.settingDivider,
        pressed && { opacity: 0.6 },
      ]}
    >
      {inner}
    </Pressable>
  );
}

export function NavRow({
  icon,
  tint,
  label,
  sub,
  value,
  danger,
  last,
  onPress,
}: {
  icon?: IconName;
  tint?: Tint;
  label: string;
  sub?: string;
  value?: string;
  danger?: boolean;
  last?: boolean;
  onPress: () => void;
}) {
  const p = usePalette();
  const s = useSettingsStyles();
  return (
    <Setting
      icon={icon}
      tint={tint}
      label={label}
      sub={sub}
      danger={danger}
      last={last}
      onPress={onPress}
      accessibilityLabel={`${label}${sub ? `. ${sub}` : ""}${value ? `. ${value}` : ""}`}
      right={
        <>
          {!!value && <Text style={s.settingValue}>{value}</Text>}
          <Ionicons name="chevron-forward" size={16} color={p.muted} />
        </>
      }
    />
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
  const p = usePalette();
  return (
    <Setting
      icon={icon}
      tint={tint}
      label={label}
      sub={sub}
      last={last}
      right={
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: p.line, true: p.primary }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={p.line}
          accessibilityLabel={label}
        />
      }
    />
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
  const s = useSettingsStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        s.setting,
        !last && s.settingDivider,
        pressed && { opacity: 0.6 },
      ]}
    >
      <View style={s.settingHead}>
        <View style={s.settingText}>
          <Text style={s.settingLabel}>{label}</Text>
          {!!sub && <Text style={s.settingSub}>{sub}</Text>}
        </View>
        <View style={[s.radio, selected && s.radioOn]}>
          {selected && <View style={s.radioDot} />}
        </View>
      </View>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  const p = usePalette();
  const s = useSettingsStyles();
  const [w, setW] = useState(0);
  const idx = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const pos = useRef(new Animated.Value(idx)).current;

  useEffect(() => {
    Animated.spring(pos, {
      toValue: idx,
      useNativeDriver: true,
      speed: 22,
      bounciness: 4,
    }).start();
  }, [idx, pos]);

  const thumbW = w > 0 ? (w - 6) / options.length : 0;
  const translateX = pos.interpolate({
    inputRange: [0, Math.max(1, options.length - 1)],
    outputRange: [0, thumbW * Math.max(1, options.length - 1)],
  });

  return (
    <View style={s.seg} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {thumbW > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[s.segThumb, { width: thumbW, transform: [{ translateX }] }]}
        />
      )}
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: on }}
            style={s.segItem}
          >
            <Text
              style={[
                s.segText,
                on && { color: p.text, fontFamily: fonts.semiBold },
              ]}
              numberOfLines={1}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

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
  const p = usePalette();
  const s = useSettingsStyles();
  const [hidden, setHidden] = useState(!!secure);
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View
        style={[
          s.input,
          focus && { borderColor: p.primary },
          !!error && { borderColor: DANGER },
        ]}
      >
        <TextInput
          {...rest}
          secureTextEntry={secure && hidden}
          placeholderTextColor={p.muted}
          onFocus={(e) => {
            setFocus(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            rest.onBlur?.(e);
          }}
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
              color={p.muted}
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
  const p = usePalette();
  const s = useSettingsStyles();
  const bg =
    variant === "primary"
      ? p.primary
      : variant === "danger"
        ? DANGER
        : p.surface;
  const fg = variant === "ghost" ? p.text : "#fff";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: bg },
        variant === "ghost" && { borderWidth: 1, borderColor: p.line },
        disabled && { opacity: 0.45 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={17} color={fg} /> : null}
      <Text style={[s.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/** Compact footer button (Cancel / primary / danger) with loading spinner. */
export function ActionButton({
  label,
  onPress,
  icon,
  variant = "primary",
  loading = false,
  disabled = false,
  flex,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: "primary" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  flex?: number;
}) {
  const p = usePalette();
  const s = useSettingsStyles();
  const ghost = variant === "ghost";
  const bg = variant === "danger" ? DANGER : p.primary;
  const fg = ghost ? p.text : "#FFFFFF";
  const off = disabled && !loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        s.actionBtn,
        ghost ? s.actionBtnGhost : { backgroundColor: bg },
        flex !== undefined && { flex },
        off && { opacity: 0.45 },
        pressed && !off && !loading && { opacity: ghost ? 0.7 : 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : icon ? (
        <Ionicons name={icon} size={15} color={fg} />
      ) : null}
      <Text style={[s.actionBtnText, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const TONES = {
  info: { color: INFO, icon: "information-circle" },
  success: { color: SUCCESS, icon: "shield-checkmark" },
  warn: { color: WARN, icon: "warning" },
  danger: { color: DANGER, icon: "alert-circle" },
} as const;

export function Banner({
  tone = "info",
  text,
}: {
  tone?: keyof typeof TONES;
  text: string;
}) {
  const s = useSettingsStyles();
  const t = TONES[tone];
  return (
    <View
      style={[
        s.banner,
        {
          backgroundColor: alpha(t.color, 0.1),
          borderColor: alpha(t.color, 0.3),
        },
      ]}
      accessibilityRole="alert"
    >
      <View style={[s.bannerIcon, { backgroundColor: alpha(t.color, 0.16) }]}>
        <Ionicons name={t.icon as IconName} size={16} color={t.color} />
      </View>
      <Text style={s.bannerText}>{text}</Text>
    </View>
  );
}

export const makeSettingsStyles = (p: UiPalette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.bg },
    content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 48 },
    gap: { height: 24 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: p.line },
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: p.line,
      backgroundColor: p.bg,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
      backgroundColor: p.bg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: p.line,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.line,
      alignItems: "center",
      justifyContent: "center",
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: alpha(p.primary, 0.14),
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: { flex: 1, minWidth: 0 },
    headerTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 18,
      lineHeight: 23,
      color: p.text,
      letterSpacing: -0.3,
      includeFontPadding: false,
    },
    headerSub: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 16,
      color: p.muted,
      includeFontPadding: false,
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      height: 34,
      paddingHorizontal: 12,
      borderRadius: 17,
    },
    pillText: {
      fontFamily: fonts.semiBold,
      fontSize: 12,
      lineHeight: 16,
      includeFontPadding: false,
    },

    sectionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
      paddingHorizontal: 2,
    },
    sectionLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
    sectionTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
      lineHeight: 19,
      color: p.text,
      includeFontPadding: false,
    },
    sectionHint: {
      fontFamily: fonts.regular,
      fontSize: 11.5,
      lineHeight: 15,
      color: p.muted,
      includeFontPadding: false,
    },
    sectionLabel: {
      fontFamily: fonts.semiBold,
      fontSize: 11.5,
      lineHeight: 16,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: p.muted,
      marginBottom: 8,
      marginLeft: 4,
      includeFontPadding: false,
    },
    body: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 20,
      color: p.muted,
      includeFontPadding: false,
    },

    group: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.line,
      backgroundColor: p.card,
      paddingHorizontal: 14,
    },
    groupDanger: { borderColor: alpha(DANGER, 0.3) },
    setting: { paddingVertical: 14, gap: 12 },
    settingDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: p.line,
    },
    settingHead: { flexDirection: "row", alignItems: "center", gap: 10 },
    settingText: { flex: 1, minWidth: 0 },
    iconTile: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    settingLabel: {
      fontFamily: fonts.medium,
      fontSize: 13.5,
      lineHeight: 18,
      color: p.text,
      includeFontPadding: false,
    },
    settingSub: {
      fontFamily: fonts.regular,
      fontSize: 11,
      lineHeight: 15,
      color: p.muted,
      includeFontPadding: false,
    },
    settingValue: {
      fontFamily: fonts.medium,
      fontSize: 12.5,
      lineHeight: 17,
      color: p.muted,
      includeFontPadding: false,
    },

    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: p.line,
      alignItems: "center",
      justifyContent: "center",
    },
    radioOn: { borderColor: p.primary },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: p.primary,
    },

    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
    },
    bannerIcon: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    bannerText: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: 12.5,
      lineHeight: 18,
      color: p.text,
      includeFontPadding: false,
    },

    seg: {
      flexDirection: "row",
      padding: 3,
      borderRadius: 11,
      backgroundColor: p.surface,
    },
    segThumb: {
      position: "absolute",
      top: 3,
      bottom: 3,
      left: 3,
      borderRadius: 8,
      backgroundColor: p.card,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    segItem: {
      flex: 1,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    segText: {
      fontFamily: fonts.medium,
      fontSize: 12,
      lineHeight: 16,
      color: p.text2,
      includeFontPadding: false,
    },

    fieldLabel: {
      fontFamily: fonts.medium,
      fontSize: 12.5,
      lineHeight: 18,
      color: p.text,
      includeFontPadding: false,
    },
    input: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: p.surface,
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
      color: p.text,
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
      color: p.muted,
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

    actionBtn: {
      minWidth: 0,
      height: 44,
      borderRadius: 12,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    actionBtnGhost: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: p.line,
    },
    actionBtnText: {
      flexShrink: 1,
      fontFamily: fonts.semiBold,
      fontSize: 13,
      lineHeight: 18,
      includeFontPadding: false,
    },
  });
