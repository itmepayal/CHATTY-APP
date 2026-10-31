import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import AuthInput from "../../components/forms/AuthInput";
import GoogleIcon from "../../components/icons/GoogleIcon";
import {
  Reveal,
  ShimmerSweep,
  useFloat,
  useReduceMotion,
} from "../../components/motion";
import { colors, palette } from "../../constants/theme";
import { styles } from "../../styles/login.styles";

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const press = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const logoFloat = useFloat(reduce, 3200);
  const arrow = useFloat(reduce, 900);

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

  const shakeForm = useCallback(() => {
    if (reduce) return;
    const step = (to: number) =>
      Animated.timing(shake, {
        toValue: to,
        duration: 60,
        easing: Easing.linear,
        useNativeDriver: true,
      });
    Animated.sequence([step(-8), step(8), step(-6), step(6), step(0)]).start();
  }, [shake, reduce]);

  const errors = {
    email: email.trim().length < 3 ? "Enter email or username" : "",
    password: password.length < 1 ? "Enter your password" : "",
  };
  const isValid = !errors.email && !errors.password;

  const onLogin = async () => {
    setSubmitted(true);
    if (!isValid) {
      shakeForm();
      return;
    }
    if (loading) return;
    try {
      setLoading(true);
      console.log("Login attempt", { email });
      await new Promise((r) => setTimeout(r, 1000));
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = () => {
    console.log("Google sign in");
  };

  const onForgot = () => router.push("/auth/reset-password");

  const onBack = () =>
    router.canGoBack() ? router.back() : router.replace("/");

  if (!fontsLoaded) return null;

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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <Reveal reduce={reduce} delay={100} from={16} style={styles.hero}>
            <Animated.View
              style={[
                styles.logoWrap,
                {
                  transform: [
                    {
                      translateY: logoFloat.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -4],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.logoRing} />
              <LinearGradient
                colors={[colors.primary, palette.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBox}
              >
                <Ionicons
                  name="chatbubble-ellipses"
                  size={20}
                  color={palette.white}
                />
              </LinearGradient>
            </Animated.View>

            <Text style={styles.title} accessibilityRole="header">
              Welcome back 👋
            </Text>
            <Text style={styles.subtitle}>
              Sign in to continue to your Chatty account
            </Text>
          </Reveal>

          <Reveal reduce={reduce} delay={200} from={60} style={styles.panel}>
            <ScrollView
              style={styles.panelScroll}
              contentContainerStyle={[
                styles.panelContent,
                { paddingBottom: Math.max(insets.bottom, 16) + 20 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.grabber} />

              <Animated.View style={{ transform: [{ translateX: shake }] }}>
                <Reveal reduce={reduce} delay={360} from={14}>
                  <AuthInput
                    label="Email or Username"
                    placeholder="Enter your email or username"
                    leftIcon="mail-outline"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={submitted ? errors.email : ""}
                  />
                </Reveal>
                <Reveal reduce={reduce} delay={430} from={14}>
                  <AuthInput
                    label="Password"
                    placeholder="Enter your password"
                    leftIcon="lock-closed-outline"
                    value={password}
                    onChangeText={setPassword}
                    isPassword
                    rightLabel="Forgot password?"
                    onRightLabelPress={onForgot}
                    error={submitted ? errors.password : ""}
                  />
                </Reveal>
              </Animated.View>

              <Reveal
                reduce={reduce}
                delay={520}
                from={16}
                scaleFrom={0.97}
                style={{ marginTop: 8 }}
              >
                <Pressable
                  onPress={onLogin}
                  onPressIn={() => pressTo(0.98)}
                  onPressOut={() => pressTo(1)}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Log in"
                  accessibilityState={{ busy: loading, disabled: loading }}
                >
                  <Animated.View style={{ transform: [{ scale: press }] }}>
                    <LinearGradient
                      colors={[colors.primary, palette.gradientEnd]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.primaryBtn}
                    >
                      {loading ? (
                        <ActivityIndicator color={palette.white} />
                      ) : (
                        <>
                          <Text style={styles.primaryText}>Log in</Text>
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
                        </>
                      )}
                    </LinearGradient>
                  </Animated.View>
                </Pressable>
              </Reveal>

              <Reveal reduce={reduce} delay={600} from={10}>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.or}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>
              </Reveal>

              <Reveal reduce={reduce} delay={660} from={12}>
                <Pressable
                  onPress={onGoogle}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Google"
                  style={({ pressed }) => [
                    styles.socialBtn,
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <GoogleIcon size={20} />
                  <Text style={styles.socialText}>Continue with Google</Text>
                </Pressable>
              </Reveal>

              <Reveal reduce={reduce} delay={720} from={8}>
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don't have an account? </Text>
                  <Pressable
                    onPress={() => router.replace("/auth/register")}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Register"
                  >
                    <Text style={styles.footerLink}>Register</Text>
                  </Pressable>
                </View>
              </Reveal>
            </ScrollView>
          </Reveal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
