import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  LayoutChangeEvent,
  Pressable,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { colors } from "../constants/theme";
import { palette } from "../constants/theme";
import { styles } from "../styles/main.styles";
import {
  Reveal,
  ShimmerSweep,
  useFloat,
  FloatingCard,
  CallIcon,
} from "../components/motion";

const SHOW_FLOATING_CARDS = true;

type IconName = keyof typeof Ionicons.glyphMap;

const FEATURES: { icon: IconName; title: string; caption: string }[] = [
  { icon: "shield-checkmark-outline", title: "Private", caption: "End-to-end" },
  { icon: "flash-outline", title: "Fast", caption: "Instant sync" },
  { icon: "sparkles-outline", title: "AI Assist", caption: "Smart replies" },
];

export default function GetStarted() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reduce, setReduce] = useState(false);

  const press = useRef(new Animated.Value(1)).current;
  const hero = useFloat(reduce, 3600);
  const glowPulse = useFloat(reduce, 2800);
  const arrow = useFloat(reduce, 900);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => mounted && setReduce(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduce,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const pressTo = useCallback(
    (v: number) =>
      Animated.spring(press, {
        toValue: v,
        useNativeDriver: true,
        friction: 7,
        tension: 200,
      }).start(),
    [press],
  );

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      <View pointerEvents="none" style={styles.blobTop} />
      <View pointerEvents="none" style={styles.blobLeft} />

      <SafeAreaView edges={["top"]} style={styles.safe}>
        <Reveal reduce={reduce} style={styles.header} from={-12}>
          <View style={styles.brandRow}>
            <LinearGradient
              colors={[colors.primary, palette.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBox}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={18}
                color={palette.white}
              />
            </LinearGradient>
            <Text style={styles.brand} accessibilityRole="header">
              Chatty
            </Text>
          </View>

          <View style={styles.secureBadge}>
            <Ionicons name="lock-closed" size={11} color={palette.white} />
            <Text style={styles.secureText}>Secure</Text>
          </View>
        </Reveal>

        <View style={styles.hero}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glow,
              {
                opacity: glowPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1],
                }),
                transform: [
                  {
                    scale: glowPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.12],
                    }),
                  },
                ],
              },
            ]}
          />

          <Reveal
            delay={120}
            reduce={reduce}
            style={StyleSheet.absoluteFill}
            from={24}
            scaleFrom={0.94}
          >
            <Animated.View
              style={[
                styles.floatBox,
                {
                  transform: [
                    {
                      translateY: hero.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -5],
                      }),
                    },
                    {
                      scale: hero.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.012],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.illustrationShadow}>
                <View style={styles.illustrationClip}>
                  <Image
                    source={require("../../assets/images/get-started-illustration.png")}
                    style={styles.illustration}
                    resizeMode="cover"
                    resizeMethod="scale"
                    fadeDuration={0}
                    accessibilityIgnoresInvertColors
                    accessible={false}
                  />
                  <LinearGradient
                    pointerEvents="none"
                    colors={["rgba(91,63,240,0.40)", "rgba(91,63,240,0)"]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.2 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <LinearGradient
                    pointerEvents="none"
                    colors={["rgba(91,63,240,0)", "rgba(91,63,240,0.40)"]}
                    start={{ x: 0.5, y: 0.8 }}
                    end={{ x: 0.5, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
              </View>
            </Animated.View>
          </Reveal>

          {SHOW_FLOATING_CARDS && (
            <View
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <FloatingCard
                reduce={reduce}
                delay={520}
                duration={2800}
                style={{ top: "8%", left: 22 }}
              >
                <View style={styles.cardRow}>
                  <View style={[styles.cardIcon, styles.cardIconPrimary]}>
                    <Ionicons name="person" size={11} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>Aarav</Text>
                    <Text style={styles.cardText}>Hey, how are you? 👋</Text>
                  </View>
                </View>
              </FloatingCard>

              <FloatingCard
                reduce={reduce}
                delay={700}
                duration={3200}
                style={{ bottom: "8%", right: 22 }}
              >
                <View style={styles.cardRow}>
                  <CallIcon reduce={reduce} />
                  <View>
                    <Text style={styles.cardTitle}>Voice call</Text>
                    <Text style={styles.cardText}>02:14 · HD</Text>
                  </View>
                </View>
              </FloatingCard>
            </View>
          )}
        </View>
      </SafeAreaView>

      <Reveal
        delay={240}
        reduce={reduce}
        from={60}
        style={[
          styles.panel,
          { paddingBottom: Math.max(insets.bottom, 16) + 8 },
        ]}
      >
        <View style={styles.grabber} />

        <Reveal delay={420} reduce={reduce} from={12}>
          <Text style={styles.headline}>
            Stay close to the people who matter
          </Text>
        </Reveal>
        <Reveal delay={500} reduce={reduce} from={12}>
          <Text style={styles.subline}>
            Private chats, crystal-clear calls and group conversations, all in
            one place.
          </Text>
        </Reveal>

        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.title}
              delay={600 + i * 100}
              reduce={reduce}
              from={14}
              scaleFrom={0.88}
              style={[styles.feature, i > 0 && styles.featureDivider]}
            >
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={17} color={colors.primary} />
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureCaption}>{f.caption}</Text>
            </Reveal>
          ))}
        </View>

        <Reveal delay={920} reduce={reduce} from={16} scaleFrom={0.97}>
          <Pressable
            onPress={() => router.push("/auth/register")}
            onPressIn={() => pressTo(0.98)}
            onPressOut={() => pressTo(1)}
            accessibilityRole="button"
            accessibilityLabel="Get started"
          >
            <Animated.View style={{ transform: [{ scale: press }] }}>
              <LinearGradient
                colors={[colors.primary, palette.gradientEnd]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryText}>Get started</Text>
                <Animated.View
                  style={{
                    transform: [
                      {
                        translateX: arrow.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 4],
                        }),
                      },
                    ],
                  }}
                >
                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color={palette.white}
                  />
                </Animated.View>
                <ShimmerSweep reduce={reduce} />
              </LinearGradient>
            </Animated.View>
          </Pressable>
        </Reveal>

        <Reveal delay={1000} reduce={reduce} from={10}>
          <Pressable
            onPress={() => router.push("/auth/login")}
            accessibilityRole="button"
            accessibilityLabel="Log in to your account"
            hitSlop={8}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.secondaryHint}>Already have an account?</Text>
            <Text style={styles.secondaryText}>Log in</Text>
          </Pressable>
        </Reveal>

        <Reveal delay={1080} reduce={reduce} from={8}>
          <Text style={styles.terms}>
            By continuing, you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>
        </Reveal>
      </Reveal>
    </LinearGradient>
  );
}
