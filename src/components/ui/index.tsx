import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text as RNText,
  TextInput as RNTextInput,
  TextProps,
  TextInputProps,
  Pressable,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  Easing,
  AccessibilityInfo,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleProp,
  TextStyle,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { colors } from "../../constants/theme";

export { colors };

export const BG = "#FFFFFF";
export const SURFACE = "#F3F4F8";
export const TEXT = "#0F172A";
export const TEXT_2 = "#475569";
export const MUTED = "#94A3B8";
export const LINE = "#ECEEF3";
export const ONLINE = "#16A34A";
export const DANGER = "#DC2626";
export const PRESSED = "#F7F8FB";

export const fonts = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semiBold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
};

export const space = {
  screen: 16,
  row: 12,
  gap: 8,
};

export const radius = {
  control: 12,
  pill: 10,
  card: 18,
  fab: 16,
  sheet: 24,
};

export type IconName = keyof typeof Ionicons.glyphMap;
export type Tint = [string, string];

export const Text = (props: TextProps) => (
  <RNText maxFontSizeMultiplier={1.1} {...props} />
);

export const TextInput = (props: TextInputProps) => (
  <RNTextInput maxFontSizeMultiplier={1.1} {...props} />
);

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
  }, []);
  return reduce;
}

export function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = e.nativeEvent.contentOffset.y > 4;
    setScrolled((prev) => (prev === next ? prev : next));
  }, []);
  return { scrolled, onScroll };
}

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar style="dark" />
      {children}
    </SafeAreaView>
  );
}

export function ScreenTop({
  title,
  subtitle,
  actions,
  scrolled,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  scrolled: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={[s.top, scrolled && s.topScrolled]}>
      <View style={s.header}>
        <View style={s.headerText}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.subtitle}>{subtitle}</Text>
        </View>
        <View style={s.headerActions}>{actions}</View>
      </View>
      {children}
    </View>
  );
}

export function HeaderButton({
  icon,
  label,
  onPress,
  color = TEXT,
  dot,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  dot?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [s.iconBtn, pressed && s.iconBtnPressed]}
    >
      <Ionicons name={icon} size={19} color={color} />
      {dot && <View style={s.bellDot} />}
    </Pressable>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  label,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  label: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[s.search, focused && s.searchFocused]}>
      <Ionicons
        name="search"
        size={17}
        color={focused ? colors.primary : MUTED}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        style={s.searchInput}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel={label}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={17} color={MUTED} />
        </Pressable>
      )}
    </View>
  );
}

export function TabPills<T extends string>({
  tabs,
  active,
  onChange,
  badges,
  badgeTone = "primary",
}: {
  tabs: readonly T[];
  active: T;
  onChange: (t: T) => void;
  badges?: Partial<Record<T, number>>;
  badgeTone?: "primary" | "danger";
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.tabsScroll}
      contentContainerStyle={s.tabs}
    >
      {tabs.map((t) => {
        const on = t === active;
        const count = badges?.[t] ?? 0;
        return (
          <Pressable
            key={t}
            onPress={() => onChange(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[s.tab, on && s.tabOn]}
          >
            <Text style={[s.tabText, on && s.tabTextOn]}>{t}</Text>
            {count > 0 && (
              <View
                style={[
                  s.tabCount,
                  badgeTone === "danger" && s.tabCountDanger,
                  on && s.tabCountOn,
                ]}
              >
                <Text style={[s.tabCountText, on && { color: colors.primary }]}>
                  {count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export const listContentStyle = { paddingBottom: 100, flexGrow: 1 };

export function SectionHeader({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {count !== undefined && <Text style={s.sectionCount}>{count}</Text>}
    </View>
  );
}

export const Separator = () => <View style={s.separator} />;

export function StripSection({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={s.strip}>
      <View style={s.stripHeading}>
        <Text style={s.sectionTitle}>{title}</Text>
        {right}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.stripRow}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function StripItem({
  avatar,
  label,
  onPress,
  accessibilityLabel,
}: {
  avatar: React.ReactNode;
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={s.stripItem}
    >
      {avatar}
      <Text style={s.stripName} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Avatar({
  name,
  icon,
  tint,
  size = 48,
  online,
}: {
  name?: string;
  icon?: IconName;
  tint: Tint;
  size?: number;
  online?: boolean;
}) {
  return (
    <View>
      <View
        style={[
          s.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: tint[0],
          },
        ]}
      >
        {icon ? (
          <Ionicons name={icon} size={size * 0.42} color={tint[1]} />
        ) : (
          <Text
            style={[
              s.avatarText,
              {
                fontSize: size * 0.32,
                lineHeight: size * 0.44,
                color: tint[1],
              },
            ]}
          >
            {initials(name ?? "")}
          </Text>
        )}
      </View>
      {online && (
        <View
          style={[
            s.onlineDot,
            size < 48 && { width: 11, height: 11, borderRadius: 6 },
          ]}
        />
      )}
    </View>
  );
}

export function FadeIn({
  index,
  reduceMotion,
  children,
}: {
  index: number;
  reduceMotion: boolean;
  children: React.ReactNode;
}) {
  const v = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      v.setValue(1);
      return;
    }
    const anim = Animated.timing(v, {
      toValue: 1,
      duration: 320,
      delay: Math.min(index, 6) * 45,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [index, reduceMotion, v]);

  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [
          {
            translateY: v.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

export function ListRow({
  index = 0,
  reduceMotion = false,
  avatar,
  title,
  titleStrong,
  titleDanger,
  time,
  timeStrong,
  metaLine,
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
  children,
}: {
  index?: number;
  reduceMotion?: boolean;
  avatar: React.ReactNode;
  title: string;
  titleStrong?: boolean;
  titleDanger?: boolean;
  time?: string;
  timeStrong?: boolean;
  metaLine?: React.ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  children?: React.ReactNode;
}) {
  return (
    <FadeIn index={index} reduceMotion={reduceMotion}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={250}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [s.row, pressed && s.rowPressed]}
      >
        {avatar}
        <View style={s.rowBody}>
          <View style={s.rowTop}>
            <Text
              style={[
                s.name,
                titleStrong && s.nameStrong,
                titleDanger && s.nameDanger,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {!!time && (
              <Text style={[s.time, timeStrong && s.timeStrong]}>{time}</Text>
            )}
          </View>
          {metaLine}
          <View style={s.rowBottom}>{children}</View>
        </View>
      </Pressable>
    </FadeIn>
  );
}

export function PreviewText({
  children,
  strong,
  accent,
}: {
  children: React.ReactNode;
  strong?: boolean;
  accent?: boolean;
}) {
  const style: StyleProp<TextStyle> = [
    s.preview,
    strong && s.previewStrong,
    accent && s.previewAccent,
  ];
  return (
    <Text style={style} numberOfLines={1}>
      {children}
    </Text>
  );
}

export const rowIconStyle = { marginRight: 4 };

export function RowMeta({ children }: { children: React.ReactNode }) {
  return <View style={s.meta}>{children}</View>;
}

export function Badge({ count, muted }: { count: number; muted?: boolean }) {
  return (
    <View style={[s.badge, muted && s.badgeMuted]}>
      <Text style={s.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

export function CaptionLine({ children }: { children: React.ReactNode }) {
  return <View style={s.captionLine}>{children}</View>;
}

export function Caption({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "online";
}) {
  return (
    <Text style={[s.caption, tone === "online" && { color: ONLINE }]}>
      {children}
    </Text>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptySub}>{subtitle}</Text>
      {action}
    </View>
  );
}

export function Fab({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        s.fab,
        pressed && { transform: [{ scale: 0.95 }] },
      ]}
    >
      <Ionicons name={icon} size={22} color="#fff" />
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  icon,
  onPress,
  style,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  style?: StyleProp<import("react-native").ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [s.button, pressed && { opacity: 0.85 }, style]}
    >
      {icon && <Ionicons name={icon} size={18} color="#fff" />}
      <Text style={s.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function FieldLabel({
  children,
  style,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[s.fieldLabel, style]}>{children}</Text>;
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={MUTED}
      {...props}
      style={[s.field, props.style]}
    />
  );
}

export function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={s.sheetRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          style={s.backdrop}
          onPress={onClose}
          accessibilityLabel="Close menu"
        />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.grabber} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ActionSheet({
  visible,
  onClose,
  avatar,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  avatar?: React.ReactNode;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {!!title && (
        <>
          <View style={s.sheetHeader}>
            {avatar}
            <View style={s.sheetHeaderText}>
              <Text style={s.sheetName} numberOfLines={1}>
                {title}
              </Text>
              {!!subtitle && (
                <Text style={s.sheetSub} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          <View style={s.sheetDivider} />
        </>
      )}
      {children}
    </BottomSheet>
  );
}

export function SheetAction({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [s.action, pressed && s.rowPressed]}
    >
      <View style={[s.actionIcon, danger && s.actionIconDanger]}>
        <Ionicons name={icon} size={17} color={danger ? DANGER : TEXT_2} />
      </View>
      <Text style={[s.actionText, danger && { color: DANGER }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  top: {
    backgroundColor: BG,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "transparent",
  },
  topScrolled: { borderBottomColor: LINE },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.screen,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerText: { flex: 1 },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 30,
    color: TEXT,
    letterSpacing: -0.3,
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: MUTED,
    includeFontPadding: false,
  },
  headerActions: { flexDirection: "row", gap: space.gap },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.control,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnPressed: { backgroundColor: LINE },
  bellDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DANGER,
    borderWidth: 1.5,
    borderColor: SURFACE,
  },

  search: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: space.screen,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: radius.control,
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: "transparent",
    gap: space.gap,
  },
  searchFocused: { backgroundColor: BG, borderColor: colors.primary },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: TEXT,
    paddingVertical: 0,
    includeFontPadding: false,
  },

  tabsScroll: { flexGrow: 0 },
  tabs: {
    gap: space.gap,
    paddingHorizontal: space.screen,
    paddingTop: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: SURFACE,
  },
  tabOn: { backgroundColor: colors.primary },
  tabText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: TEXT_2,
    includeFontPadding: false,
  },
  tabTextOn: { color: "#fff", fontFamily: fonts.semiBold },
  tabCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    marginLeft: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  tabCountDanger: { backgroundColor: DANGER },
  tabCountOn: { backgroundColor: "#fff" },
  tabCountText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 14,
    color: "#fff",
    includeFontPadding: false,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: space.screen,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    lineHeight: 14,
    color: MUTED,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    includeFontPadding: false,
  },
  sectionCount: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 14,
    color: MUTED,
    includeFontPadding: false,
  },

  strip: { paddingTop: 16, paddingLeft: space.screen },
  stripHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: space.screen,
  },
  stripRow: { paddingTop: 10, paddingRight: space.screen, gap: 14 },
  stripItem: { alignItems: "center", width: 54 },
  stripName: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    lineHeight: 15,
    color: TEXT_2,
    marginTop: 5,
    includeFontPadding: false,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.screen,
    paddingVertical: space.row,
  },
  rowPressed: { backgroundColor: PRESSED },
  rowBody: { flex: 1, minWidth: 0, marginLeft: 12 },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowBottom: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  name: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
    marginRight: 8,
    includeFontPadding: false,
  },
  nameStrong: { fontFamily: fonts.semiBold },
  nameDanger: { color: DANGER },
  time: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    lineHeight: 15,
    color: MUTED,
    includeFontPadding: false,
  },
  timeStrong: { fontFamily: fonts.semiBold, color: colors.primary },
  preview: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
    includeFontPadding: false,
  },
  previewStrong: { fontFamily: fonts.medium, color: TEXT_2 },
  previewAccent: { fontFamily: fonts.medium, color: colors.primary },
  meta: { flexDirection: "row", alignItems: "center", marginLeft: 8, gap: 6 },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
    marginLeft: 76,
    marginRight: space.screen,
  },
  captionLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    lineHeight: 15,
    color: MUTED,
    includeFontPadding: false,
  },

  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.bold, includeFontPadding: false },
  onlineDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: ONLINE,
    borderWidth: 2.5,
    borderColor: BG,
  },

  badge: {
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeMuted: { backgroundColor: MUTED },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 14,
    color: "#fff",
    includeFontPadding: false,
  },

  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14.5,
    lineHeight: 21,
    color: TEXT,
    marginTop: 14,
    textAlign: "center",
    includeFontPadding: false,
  },
  emptySub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: MUTED,
    textAlign: "center",
    marginTop: 4,
    includeFontPadding: false,
  },

  fab: {
    position: "absolute",
    right: space.screen,
    bottom: 20,
    width: 52,
    height: 52,
    borderRadius: radius.fab,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },

  button: {
    height: 48,
    borderRadius: radius.control,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 19,
    color: "#fff",
    includeFontPadding: false,
  },
  fieldLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    lineHeight: 14,
    color: TEXT_2,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 8,
    includeFontPadding: false,
  },
  field: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: radius.control,
    paddingHorizontal: 12,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: TEXT,
    backgroundColor: SURFACE,
    includeFontPadding: false,
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  sheetRoot: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: BG,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: LINE,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  sheetHeaderText: { flex: 1, marginLeft: 12 },
  sheetName: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
    includeFontPadding: false,
  },
  sheetSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: MUTED,
    includeFontPadding: false,
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
    marginVertical: 10,
    marginHorizontal: 12,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.control,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: SURFACE,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconDanger: { backgroundColor: "#FEE2E2" },
  actionText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 20,
    color: TEXT,
    marginLeft: 12,
    includeFontPadding: false,
  },
});
