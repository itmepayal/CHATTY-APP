import React, { useState, useEffect, useRef } from "react";
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

export default function Login() {
  const router = useRouter();

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

  // ---------- Validation ----------
  const errors = {
    email: email.trim().length < 3 ? "Enter email or username" : "",
    password: password.length < 1 ? "Enter your password" : "",
  };
  const isValid = !errors.email && !errors.password;

  const onLogin = async () => {
    setSubmitted(true);
    if (!isValid || loading) return;
    try {
      setLoading(true);
      console.log("Login", { email, password });
      await new Promise((r) => setTimeout(r, 1000));
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = () => {
    console.log("Google sign in");
  };

  const onForgot = () => router.push("/auth/reset-password");

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

            <Text style={styles.brand}>Chatty</Text>

            <Text style={styles.heading}>
              Welcome <Text style={styles.headingAccent}>Back</Text> 👋
            </Text>
            <Text style={styles.sub}>Sign in to continue to your account</Text>

            {/* Form */}
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
            <AuthInput
              label="Password"
              placeholder="Enter your password"
              leftIcon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              isPassword
              rightLabel="Forgot Password?"
              onRightLabelPress={onForgot}
              error={submitted ? errors.password : ""}
            />

            {/* Login button */}
            <Animated.View
              style={{ transform: [{ scale: btnScale }], marginTop: 12 }}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={onLogin}
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
                      <Text style={styles.primaryText}>Login</Text>
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
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => router.replace("/auth/register")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.footerLink}>Register</Text>
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

  brand: {
    alignSelf: "center",
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: colors.primary,
    marginTop: 2,
  },
  heading: {
    alignSelf: "center",
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: colors.text,
    marginTop: 14,
  },
  headingAccent: { color: colors.primary, fontFamily: "Poppins_700Bold" },
  sub: {
    alignSelf: "center",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: colors.muted,
    marginBottom: 18,
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
    marginVertical: 14,
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
    marginTop: 16,
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
