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
import { colors } from "../../constants/theme";

const GRADIENT_END = "#7C5CFF";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResetPassword() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
    email: !EMAIL_REGEX.test(email.trim()) ? "Enter a valid email" : "",
  };
  const isValid = !errors.email;

  const onSend = async () => {
    setSubmitted(true);
    if (!isValid || loading) return;
    try {
      setLoading(true);
      // TODO: yahan API logic aayega (send reset link / OTP)
      console.log("Reset password for", email.trim());
      await new Promise((r) => setTimeout(r, 1200)); // demo delay, API lagate hi hata dena
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (loading) return;
    try {
      setLoading(true);
      // TODO: resend API logic
      console.log("Resend reset link to", email.trim());
      await new Promise((r) => setTimeout(r, 1000));
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => router.replace("/auth/login");

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

      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        activeOpacity={0.8}
        onPress={goToLogin}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </TouchableOpacity>

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
                <Ionicons
                  name={sent ? "mail-open" : "key"}
                  size={22}
                  color="#fff"
                />
              </LinearGradient>
            </Animated.View>

            {!sent ? (
              <>
                <Text style={styles.heading}>
                  Reset <Text style={styles.headingAccent}>Password</Text>
                </Text>
                <Text style={styles.sub}>
                  Enter the email linked to your account and we'll send you a
                  link to reset your password.
                </Text>

                {/* Form */}
                <AuthInput
                  label="Email"
                  placeholder="name@example.com"
                  leftIcon="mail-outline"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  valid={!errors.email}
                  error={submitted ? errors.email : ""}
                />

                {/* Send button */}
                <Animated.View
                  style={{ transform: [{ scale: btnScale }], marginTop: 12 }}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={onSend}
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
                          <Text style={styles.primaryText}>
                            Send Reset Link
                          </Text>
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
              </>
            ) : (
              <>
                <Text style={styles.heading}>
                  Check Your <Text style={styles.headingAccent}>Email</Text>
                </Text>
                <Text style={styles.sub}>
                  We've sent a password reset link to
                </Text>
                <Text style={styles.sentEmail}>{email.trim()}</Text>

                {/* Back to login */}
                <Animated.View
                  style={{ transform: [{ scale: btnScale }], marginTop: 12 }}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={goToLogin}
                    onPressIn={pressIn}
                    onPressOut={pressOut}
                  >
                    <LinearGradient
                      colors={[colors.primary, GRADIENT_END]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryBtn}
                    >
                      <Text style={styles.primaryText}>Back to Login</Text>
                      <View style={styles.arrowCircle}>
                        <Ionicons
                          name="arrow-forward"
                          size={14}
                          color={colors.primary}
                        />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Didn't get the email? </Text>
                  <TouchableOpacity
                    onPress={onResend}
                    disabled={loading}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={styles.footerLink}>Resend</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!sent && (
              <View style={styles.footer}>
                <Text style={styles.footerText}>Remember your password? </Text>
                <TouchableOpacity
                  onPress={goToLogin}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.footerLink}>Login</Text>
                </TouchableOpacity>
              </View>
            )}
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

  // Back button
  backBtn: {
    position: "absolute",
    top: 52,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

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
    marginTop: 10,
  },
  headingAccent: { color: colors.primary, fontFamily: "Poppins_700Bold" },
  sub: {
    alignSelf: "center",
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 4,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  sentEmail: {
    alignSelf: "center",
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: colors.text,
    marginTop: -12,
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
