import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, TextInput, fonts, usePalette } from "../ui";
import { alpha, useTheme } from "../../theme/theme";
import { s, TRACK_PAD } from "../../styles/settings/setting-header.styles";

type Props<T extends string> = {
  title: string;
  subtitle: string;
  query: string;
  onChangeQuery: (v: string) => void;
  tabs: readonly T[];
  activeTab: T;
  onChangeTab: (t: T) => void;
  onLogout: () => void;
  onBell: () => void;
  bellDot?: boolean;
};

export function SettingsHeader<T extends string>({
  title,
  subtitle,
  query,
  onChangeQuery,
  tabs,
  activeTab,
  onChangeTab,
  onLogout,
  onBell,
  bellDot,
}: Props<T>) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const p = usePalette();
  const [focused, setFocused] = useState(false);
  const [trackW, setTrackW] = useState(0);

  const fg = p.onPrimary;
  const lightFg = fg === "#FFFFFF";
  const glass = alpha(fg, 0.12);
  const glassPressed = alpha(fg, 0.22);
  const glassBorder = alpha(fg, 0.18);
  const softText = alpha(fg, 0.72);
  const activeTabText = lightFg ? colors.gradientBottom : "#FFFFFF";

  const count = Math.max(tabs.length, 1);
  const tabW = trackW > 0 ? (trackW - TRACK_PAD * 2) / count : 0;
  const activeIndex = Math.max(tabs.indexOf(activeTab), 0);
  const slide = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);

  useEffect(() => {
    if (tabW === 0) return;
    const to = activeIndex * tabW;
    if (!placed.current) {
      slide.setValue(to);
      placed.current = true;
      return;
    }
    Animated.timing(slide, {
      toValue: to,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeIndex, tabW, slide]);

  const onTrackLayout = (e: LayoutChangeEvent) =>
    setTrackW(e.nativeEvent.layout.width);

  return (
    <View
      style={[
        s.shadow,
        { backgroundColor: colors.gradientBottom, shadowColor: colors.shadow },
      ]}
    >
      <LinearGradient
        colors={[colors.gradientTop, colors.gradientBottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.wrap, { paddingTop: insets.top + 14 }]}
      >
        <View style={s.topRow}>
          <View style={s.titleBlock}>
            <Text
              style={[s.title, { color: fg }]}
              numberOfLines={1}
              accessibilityRole="header"
            >
              {title}
            </Text>
            <Text style={[s.subtitle, { color: softText }]} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>

          <View style={s.actions}>
            <Pressable
              onPress={onBell}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={
                bellDot ? "Notifications, new activity" : "Notifications"
              }
              style={({ pressed }) => [
                s.iconBtn,
                {
                  backgroundColor: pressed ? glassPressed : glass,
                  borderColor: glassBorder,
                },
              ]}
            >
              <Ionicons name="notifications-outline" size={19} color={fg} />
              {bellDot ? (
                <View
                  style={[
                    s.dot,
                    {
                      backgroundColor: colors.error,
                      borderColor: colors.gradientTop,
                    },
                  ]}
                />
              ) : null}
            </Pressable>

            <Pressable
              onPress={onLogout}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Log out"
              style={({ pressed }) => [
                s.logout,
                {
                  backgroundColor: pressed ? glassPressed : glass,
                  borderColor: glassBorder,
                },
              ]}
            >
              <Ionicons name="log-out-outline" size={17} color={fg} />
              <Text style={[s.logoutText, { color: fg }]}>Log out</Text>
            </Pressable>
          </View>
        </View>

        <View
          style={[
            s.search,
            {
              backgroundColor: focused ? alpha(fg, 0.2) : glass,
              borderColor: focused ? alpha(fg, 0.5) : glassBorder,
            },
          ]}
        >
          <Ionicons name="search" size={17} color={focused ? fg : softText} />
          <TextInput
            value={query}
            onChangeText={onChangeQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search settings"
            placeholderTextColor={alpha(fg, 0.58)}
            selectionColor={fg}
            cursorColor={fg}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Search settings"
            style={[s.input, { color: fg }]}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => onChangeQuery("")}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={17} color={softText} />
            </Pressable>
          )}
        </View>

        <View
          style={[
            s.track,
            { backgroundColor: glass, borderColor: glassBorder },
          ]}
          onLayout={onTrackLayout}
          accessibilityRole="tablist"
        >
          {tabW > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                s.pill,
                {
                  width: tabW,
                  backgroundColor: fg,
                  transform: [{ translateX: slide }],
                },
              ]}
            />
          )}

          {tabs.map((t) => {
            const on = t === activeTab;
            return (
              <Pressable
                key={t}
                onPress={() => onChangeTab(t)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={t}
                style={s.tab}
              >
                <Text
                  style={[
                    s.tabText,
                    { color: on ? activeTabText : softText },
                    on && { fontFamily: fonts.medium },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}
