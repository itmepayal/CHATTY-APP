import React, { useCallback, useMemo, useRef, useState } from "react";
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
import { styles } from "../../styles/register.styles";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getPasswordStrength = (pwd: string) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0 - 4
};

const STRENGTH_META = [
  { label: "Too short", color: "#E5E7EB" },
  { label: "Weak", color: "#EF4444" },
  { label: "Okay", color: "#F59E0B" },
  { label: "Good", color: "#22C55E" },
  { label: "Strong", color: "#16A34A" },
];

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
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

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const errors = {
    fullName: fullName.trim().length < 3 ? "Enter your full name" : "",
    email: !EMAIL_REGEX.test(email.trim()) ? "Enter a valid email" : "",
    username:
      username.trim().length < 3
        ? "Min 3 characters"
        : /\s/.test(username)
          ? "No spaces allowed"
          : "",
    password: password.length < 8 ? "Min 8 characters" : "",
  };
  const isValid = !Object.values(errors).some(Boolean);

  const onRegister = async () => {
    setSubmitted(true);
    if (!isValid) {
      shakeForm();
      return;
    }
    if (loading) return;
    try {
      setLoading(true);
      console.log("Register attempt", { fullName, email, username });
      await new Promise((r) => setTimeout(r, 1200));
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = () => {
    console.log("Google sign in");
  };

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
          {/* hero on gradient */}
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
              Create your account
            </Text>
            <Text style={styles.subtitle}>
              Join Chatty and start connecting
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
                <Reveal reduce={reduce} delay={340} from={14}>
                  <AuthInput
                    label="Full Name"
                    placeholder="John Doe"
                    leftIcon="person-outline"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    valid={!!fullName && !errors.fullName}
                    error={submitted ? errors.fullName : ""}
                  />
                </Reveal>
                <Reveal reduce={reduce} delay={400} from={14}>
                  <AuthInput
                    label="Email"
                    placeholder="name@example.com"
                    leftIcon="mail-outline"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    valid={!!email && !errors.email}
                    error={submitted ? errors.email : ""}
                  />
                </Reveal>
                <Reveal reduce={reduce} delay={460} from={14}>
                  <AuthInput
                    label="Username"
                    placeholder="johndoe"
                    leftIcon="at-outline"
                    value={username}
                    onChangeText={setUsername}
                    valid={!!username && !errors.username}
                    error={submitted ? errors.username : ""}
                  />
                </Reveal>
                <Reveal reduce={reduce} delay={520} from={14}>
                  <AuthInput
                    label="Password"
                    placeholder="Create a password"
                    leftIcon="lock-closed-outline"
                    value={password}
                    onChangeText={setPassword}
                    isPassword
                    error={submitted ? errors.password : ""}
                  />
                </Reveal>
              </Animated.View>

              {password.length > 0 && (
                <View style={styles.strengthWrap}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              i <= strength
                                ? STRENGTH_META[strength].color
                                : "#E5E7EB",
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text
                    style={[
                      styles.strengthLabel,
                      { color: STRENGTH_META[strength].color },
                    ]}
                  >
                    {STRENGTH_META[strength].label}
                  </Text>
                </View>
              )}

              <Reveal
                reduce={reduce}
                delay={600}
                from={16}
                scaleFrom={0.97}
                style={{ marginTop: 8 }}
              >
                <Pressable
                  onPress={onRegister}
                  onPressIn={() => pressTo(0.98)}
                  onPressOut={() => pressTo(1)}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Register"
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
                          <Text style={styles.primaryText}>Register</Text>
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

              <Reveal reduce={reduce} delay={680} from={10}>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.or}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>
              </Reveal>

              <Reveal reduce={reduce} delay={740} from={12}>
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

              <Reveal reduce={reduce} delay={800} from={8}>
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Already have an account?{" "}
                  </Text>
                  <Pressable
                    onPress={() => router.replace("/auth/login")}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Log in"
                  >
                    <Text style={styles.footerLink}>Login</Text>
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
