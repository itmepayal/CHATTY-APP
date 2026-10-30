import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Tabs } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { colors } from "../constants/theme";
import NewChat from "./new-chat";

SplashScreen.preventAutoHideAsync();

type IconName = keyof typeof Ionicons.glyphMap;

type TabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>
>[0];

const TAB_ICONS: Record<
  string,
  { on: IconName; off: IconName; title: string }
> = {
  chats: { on: "chatbubble", off: "chatbubble-outline", title: "Chats" },
  calls: { on: "call", off: "call-outline", title: "Calls" },
  groups: { on: "people", off: "people-outline", title: "Groups" },
  settings: { on: "settings", off: "settings-outline", title: "Settings" },
};

const INACTIVE = "#A0A3BD";
const SOFT = "#EEF0FF";
const BAR_PAD = 8;
const BAR_HEIGHT = 68;

function TabItem({
  routeName,
  focused,
  badge,
  onPress,
  onLongPress,
}: {
  routeName: string;
  focused: boolean;
  badge?: number | string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const cfg = TAB_ICONS[routeName];
  const lift = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(lift, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();
  }, [focused, lift]);

  const pressTo = (v: number) =>
    Animated.spring(press, {
      toValue: v,
      useNativeDriver: true,
      friction: 7,
      tension: 200,
    }).start();

  const iconScale = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const iconLift = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={cfg?.title ?? routeName}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => pressTo(0.9)}
      onPressOut={() => pressTo(1)}
      style={styles.tab}
    >
      <Animated.View
        style={[styles.tabInner, { transform: [{ scale: press }] }]}
      >
        <Animated.View
          style={{
            transform: [{ scale: iconScale }, { translateY: iconLift }],
          }}
        >
          <Ionicons
            name={(focused ? cfg?.on : cfg?.off) ?? "ellipse"}
            size={22}
            color={focused ? colors.primary : INACTIVE}
          />
          {badge != null && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </Animated.View>

        <Text
          numberOfLines={1}
          style={[styles.label, focused && styles.labelActive]}
        >
          {cfg?.title ?? routeName}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function FloatingTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
}: TabBarProps) {
  const insets = useSafeAreaInsets();
  const [barW, setBarW] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const x = useRef(new Animated.Value(0)).current;

  const visibleRoutes = state.routes.filter((r) => !!TAB_ICONS[r.name]);
  const activeKey = state.routes[state.index]?.key;
  const activeIndex = visibleRoutes.findIndex((r) => r.key === activeKey);

  const count = visibleRoutes.length;
  const tabW = barW > 0 && count > 0 ? (barW - BAR_PAD * 2) / count : 0;

  useEffect(() => {
    if (!tabW || activeIndex < 0) return;
    Animated.spring(x, {
      toValue: activeIndex * tabW,
      useNativeDriver: true,
      friction: 9,
      tension: 120,
    }).start();
  }, [activeIndex, tabW, x]);

  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const a = Keyboard.addListener(showEvt, () => setKeyboardOpen(true));
    const b = Keyboard.addListener(hideEvt, () => setKeyboardOpen(false));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);

  if (keyboardOpen || activeIndex < 0) return null;

  const onLayout = (e: LayoutChangeEvent) =>
    setBarW(e.nativeEvent.layout.width);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View style={styles.bar} onLayout={onLayout}>
        {tabW > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              { width: tabW - 8, transform: [{ translateX: x }] },
            ]}
          >
            <View style={styles.indicatorBar} />
          </Animated.View>
        )}

        {visibleRoutes.map((route, index) => {
          const focused = activeIndex === index;
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = emitter.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          const onLongPress = () => {
            emitter.emit({ type: "tabLongPress", target: route.key });
          };

          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              focused={focused}
              badge={options.tabBarBadge}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const [loaded, error] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      backBehavior="history"
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="chats" options={{ title: "Chats", tabBarBadge: 3 }} />
      <Tabs.Screen name="calls" options={{ title: "Calls" }} />
      <Tabs.Screen name="groups" options={{ title: "Groups" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />

      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="chat/[id]" options={{ href: null }} />
      <Tabs.Screen name="chat-info/[id]" options={{ href: null }} />
      <Tabs.Screen name="call/[id]" options={{ href: null }} />
      <Tabs.Screen name="video-call/[id]" options={{ href: null }} />
      <Tabs.Screen name="new-chat" options={{ title: "NewChat" }} />
      <Tabs.Screen name="new-group" options={{ title: "NewGroup" }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 6,
    backgroundColor: "transparent",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 380,
    height: BAR_HEIGHT,
    paddingHorizontal: BAR_PAD,
    borderRadius: 26,
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E4E6F4",
    elevation: 12,
    shadowColor: "#4F46E5",
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  indicator: {
    position: "absolute",
    left: BAR_PAD + 4,
    top: 8,
    height: BAR_HEIGHT - 16,
    borderRadius: 20,
    backgroundColor: SOFT,
    alignItems: "center",
  },
  indicatorBar: {
    width: 18,
    height: 3.5,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: colors.primary,
  },
  tab: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  tabInner: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 3,
  },
  label: {
    marginTop: 3,
    fontSize: 10.5,
    lineHeight: 14,
    fontFamily: "Poppins_500Medium",
    color: INACTIVE,
    includeFontPadding: false,
  },
  labelActive: {
    fontFamily: "Poppins_600SemiBold",
    color: colors.primary,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -11,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#FF4D4F",
    borderWidth: 1.5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9.5,
    fontFamily: "Poppins_600SemiBold",
    includeFontPadding: false,
  },
});
