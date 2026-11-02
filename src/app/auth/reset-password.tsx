import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
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
import AppAlert, {
  AlertButton,
  AlertType,
} from "../../components/common/AppAlert";
import {
  Reveal,
  ShimmerSweep,
  useFloat,
  useReduceMotion,
} from "../../components/motion";
import { useTheme } from "../../theme/theme";
import { useStyles } from "../../styles/reset-password.styles";
import { authApi } from "../../lib/api/auth.api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 30;

const BTN_WRAP = { marginTop: 6 } as const;

type AlertState = {
  visible: boolean;
  type: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  dismissible?: boolean;
};

const ALERT_CLOSED: AlertState = {
  visible: false,
  type: "info",
  title: "",
};

const getResetErrorMessage = (error: any): string => {
  const status = error?.response?.status;
  const serverMsg = error?.response?.data?.message;

  if (!error?.response) {
    return "Network error. Please check your internet connection and try again.";
  }
  if (serverMsg && typeof serverMsg === "string") return serverMsg;
  if (status === 404) return "No account found with this email.";
  if (status === 429) return "Too many attempts. Please try again later.";
  if (status >= 500) return "Server error. Please try again in a moment.";
  return error?.message || "Something went wrong. Please try again.";
};

export default function ResetPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const { colors } = useTheme();
  const styles = useStyles();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [email, setEmail] = useState("");
  // Form clear hone ke baad bhi "Sent to" chip aur Resend ke liye email yaha rehta hai.
  const [sentEmail, setSentEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [alertState, setAlertState] = useState<AlertState>(ALERT_CLOSED);

  const press = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const logoFloat = useFloat(reduce, 3200);
  const arrow = useFloat(reduce, 900);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const showAlert = useCallback(
    (
      type: AlertType,
      title: string,
      message?: string,
      buttons?: AlertButton[],
      dismissible = true,
    ) => {
      setAlertState({
        visible: true,
        type,
        title,
        message,
        buttons,
        dismissible,
      });
    },
    [],
  );

  const closeAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, visible: false }));
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
    email: !EMAIL_REGEX.test(email.trim()) ? "Enter a valid email" : "",
  };
  const isValid = !errors.email;

  const onSend = async () => {
    if (loading) return;
    setSubmitted(true);
    if (!isValid) {
      shakeForm();
      return;
    }

    Keyboard.dismiss();

    const targetEmail = email.trim();

    try {
      setLoading(true);

      // authApi.forgotPassword email ko trim + lowercase khud kar deta hai
      await authApi.forgotPassword({ email: targetEmail });

      // Success ke baad: email yaad rakho, form clear karo
      setSentEmail(targetEmail);
      setEmail("");
      setSubmitted(false);

      setSent(true);
      setCooldown(RESEND_SECONDS);
    } catch (error: any) {
      // Error par form clear nahi hota, taaki user dobara try kar sake
      shakeForm();
      showAlert("error", "Could not send link", getResetErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (loading || cooldown > 0 || !sentEmail) return;
    try {
      setLoading(true);

      await authApi.forgotPassword({ email: sentEmail });

      setCooldown(RESEND_SECONDS);
      showAlert(
        "success",
        "Link sent again",
        "Reset link dobara bhej diya gaya hai. Inbox ya spam folder check karo.",
      );
    } catch (error: any) {
      showAlert("error", "Could not resend", getResetErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = useCallback(() => router.replace("/auth/login"), [router]);

  // onSend har render par naya banta hai, isliye ref se stable wrapper.
  const onSendRef = useRef(onSend);
  onSendRef.current = onSend;
  const submitFromKeyboard = useCallback(() => {
    onSendRef.current();
  }, []);

  if (!fontsLoaded) return null;

  const base = sent ? 60 : 280;

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
        {/* Android par system khud resize karta hai, isliye sirf iOS par "padding". */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <View style={styles.hero}>
            <Reveal reduce={reduce} delay={100} from={16}>
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
                  colors={[colors.primary, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoBox}
                >
                  <Ionicons
                    name={sent ? "mail-open" : "key"}
                    size={19}
                    color={colors.white}
                  />
                </LinearGradient>
              </Animated.View>
            </Reveal>

            <Reveal
              key={sent ? "hero-sent" : "hero-form"}
              reduce={reduce}
              delay={sent ? 0 : 160}
              from={12}
            >
              <Text style={[styles.title]} accessibilityRole="header">
                {sent ? "Check your email" : "Reset password"}
              </Text>
              <Text style={[styles.subtitle]}>
                {sent
                  ? "We've sent a password reset link to your inbox"
                  : "Enter your email and we'll send you a reset link"}
              </Text>
            </Reveal>
          </View>

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
              overScrollMode="never"
            >
              <View style={styles.grabber} />

              {!sent ? (
                <>
                  {/* Input ke upar Reveal nahi: typing ke time flicker hota tha. */}
                  <Animated.View style={{ transform: [{ translateX: shake }] }}>
                    <AuthInput
                      label="Email"
                      placeholder="name@example.com"
                      leftIcon="mail-outline"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="send"
                      onSubmitEditing={submitFromKeyboard}
                      editable={!loading}
                      valid={!!email && !errors.email}
                      error={submitted ? errors.email : ""}
                    />
                  </Animated.View>

                  <Reveal
                    key="form-button"
                    reduce={reduce}
                    delay={base}
                    from={16}
                    scaleFrom={0.97}
                    style={BTN_WRAP}
                  >
                    <Pressable
                      onPress={onSend}
                      onPressIn={() => pressTo(0.98)}
                      onPressOut={() => pressTo(1)}
                      disabled={loading}
                      accessibilityRole="button"
                      accessibilityLabel="Send reset link"
                      accessibilityState={{ busy: loading, disabled: loading }}
                    >
                      <Animated.View style={{ transform: [{ scale: press }] }}>
                        <LinearGradient
                          colors={[colors.primary, colors.gradientEnd]}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={[styles.primaryBtn]}
                        >
                          {loading ? (
                            <ActivityIndicator color={colors.white} />
                          ) : (
                            <>
                              <Text style={[styles.primaryText]}>
                                Send reset link
                              </Text>
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
                                  size={16}
                                  color={colors.white}
                                />
                              </Animated.View>
                              <ShimmerSweep reduce={reduce} />
                            </>
                          )}
                        </LinearGradient>
                      </Animated.View>
                    </Pressable>
                  </Reveal>

                  <Reveal
                    key="form-footer"
                    reduce={reduce}
                    delay={base + 80}
                    from={8}
                  >
                    <View style={styles.footer}>
                      <Text style={[styles.footerText]}>
                        Remember your password?{" "}
                      </Text>
                      <Pressable
                        onPress={goToLogin}
                        hitSlop={8}
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel="Log in"
                      >
                        <Text style={[styles.footerLink]}>Login</Text>
                      </Pressable>
                    </View>
                  </Reveal>
                </>
              ) : (
                <>
                  <Reveal
                    key="sent-chip"
                    reduce={reduce}
                    delay={base}
                    from={14}
                    scaleFrom={0.96}
                  >
                    <View style={styles.emailChip}>
                      <View style={styles.emailChipIcon}>
                        <Ionicons
                          name="mail-outline"
                          size={17}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.emailChipBody}>
                        <Text style={[styles.emailChipLabel]}>Sent to</Text>
                        <Text style={[styles.emailChipText]} numberOfLines={1}>
                          {sentEmail}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.hint]}>
                      Can't find it? Check your spam folder or try resending the
                      link.
                    </Text>
                  </Reveal>

                  <Reveal
                    key="sent-button"
                    reduce={reduce}
                    delay={base + 80}
                    from={16}
                    scaleFrom={0.97}
                  >
                    <Pressable
                      onPress={goToLogin}
                      onPressIn={() => pressTo(0.98)}
                      onPressOut={() => pressTo(1)}
                      accessibilityRole="button"
                      accessibilityLabel="Back to login"
                    >
                      <Animated.View style={{ transform: [{ scale: press }] }}>
                        <LinearGradient
                          colors={[colors.primary, colors.gradientEnd]}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={[styles.primaryBtn]}
                        >
                          <Text style={[styles.primaryText]}>
                            Back to login
                          </Text>
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
                              size={16}
                              color={colors.white}
                            />
                          </Animated.View>
                          <ShimmerSweep reduce={reduce} />
                        </LinearGradient>
                      </Animated.View>
                    </Pressable>
                  </Reveal>

                  <Reveal
                    key="sent-footer"
                    reduce={reduce}
                    delay={base + 160}
                    from={8}
                  >
                    <View style={styles.footer}>
                      <Text style={[styles.footerText]}>
                        Didn't get the email?{" "}
                      </Text>
                      <Pressable
                        onPress={onResend}
                        disabled={loading || cooldown > 0}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Resend reset link"
                      >
                        {loading ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.primary}
                          />
                        ) : (
                          <Text
                            style={[
                              styles.footerLink,
                              cooldown > 0 && styles.footerLinkDisabled,
                            ]}
                          >
                            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </Reveal>
                </>
              )}
            </ScrollView>
          </Reveal>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <AppAlert
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        dismissible={alertState.dismissible}
        onClose={closeAlert}
      />
    </LinearGradient>
  );
}
