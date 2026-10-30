import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { colors } from "../../constants/theme";

const GRADIENT_END = "#7C5CFF";

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

  // ---------- Animations ----------
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: -4,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  // ---------- Validation ----------
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
    if (!isValid || loading) return;
    try {
      setLoading(true);
      // TODO: yahan API / auth logic aayega
      console.log("Register", { fullName, email, username, password });
      await new Promise((r) => setTimeout(r, 1200)); // demo delay, API lagate hi hata dena
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = () => {
    // TODO: Google login logic
    console.log("Google sign in");
  };

  const pressIn = () =>
    Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(btnScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Decorative background blobs */}
      <View style={styles.blobTop} pointerEvents="none" />
      <View style={styles.blobBottom} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View
            style={[
              styles.content,
              { opacity: fade, transform: [{ translateY: slide }] },
            ]}
          >
            {/* Logo */}
            <Animated.View
              style={[styles.logoWrap, { transform: [{ translateY: float }] }]}
            >
              <View style={styles.logoRing} />
              <LinearGradient
                colors={[colors.primary, GRADIENT_END]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBox}
              >
                <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
              </LinearGradient>
            </Animated.View>

            <Text style={styles.heading}>
              Create Your <Text style={styles.headingAccent}>Account</Text>
            </Text>
            <Text style={styles.sub}>Join Chatty and start connecting</Text>

            {/* Form */}
            <AuthInput
              label="Full Name"
              placeholder="John Doe"
              leftIcon="person-outline"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              valid={!errors.fullName}
              error={submitted ? errors.fullName : ""}
            />
            <AuthInput
              label="Email"
              placeholder="name@example.com"
              leftIcon="mail-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              valid={!errors.email}
              error={submitted ? errors.email : ""}
            />
            <AuthInput
              label="Username"
              placeholder="johndoe"
              leftIcon="at-outline"
              value={username}
              onChangeText={setUsername}
              valid={!errors.username}
              error={submitted ? errors.username : ""}
            />
            <AuthInput
              label="Password"
              placeholder="Create a password"
              leftIcon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              isPassword
              error={submitted ? errors.password : ""}
            />

            {/* Password strength meter */}
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

            {/* Register button */}
            <Animated.View
              style={{ transform: [{ scale: btnScale }], marginTop: 12 }}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={onRegister}
                onPressIn={pressIn}
                onPressOut={pressOut}
                disabled={loading}
              >
                <LinearGradient
                  colors={[colors.primary, GRADIENT_END]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.primaryText}>Register</Text>
                      <View style={styles.arrowCircle}>
                        <Ionicons
                          name="arrow-forward"
                          size={14}
                          color={colors.primary}
                        />
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.or}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google only */}
            <TouchableOpacity
              style={styles.socialBtn}
              activeOpacity={0.8}
              onPress={onGoogle}
            >
              <GoogleIcon size={20} />
              <Text style={styles.socialText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.replace("/auth/login")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.footerLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.bg, overflow: "hidden" },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  content: { width: "100%", maxWidth: 420, alignSelf: "center" },

  // Background decoration
  blobTop: {
    position: "absolute",
    top: -90,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primaryLight,
    opacity: 0.75,
  },
  blobBottom: {
    position: "absolute",
    bottom: -100,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primaryLight,
    opacity: 0.5,
  },

  // Logo (compact)
  logoWrap: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
  },
  logoRing: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
  },
  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },

  heading: {
    alignSelf: "center",
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: colors.text,
    marginTop: 2,
  },
  headingAccent: { color: colors.primary, fontFamily: "Poppins_700Bold" },
  sub: {
    alignSelf: "center",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.muted,
    marginBottom: 14,
  },

  // Strength meter
  strengthWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 2,
  },
  strengthBars: { flex: 1, flexDirection: "row", gap: 6 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    minWidth: 58,
    textAlign: "right",
  },

  // Buttons
  primaryBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  primaryText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  arrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { color: colors.muted, fontSize: 11, fontFamily: "Poppins_400Regular" },

  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  socialText: {
    fontSize: 14,
    color: colors.text,
    fontFamily: "Poppins_500Medium",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },
  footerText: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: "Poppins_400Regular",
  },
  footerLink: {
    fontSize: 13,
    color: colors.primary,
    fontFamily: "Poppins_700Bold",
  },
});
