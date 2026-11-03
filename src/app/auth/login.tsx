import React, { useCallback, useRef, useState } from "react";
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
import AuthInput, { AuthInputRef } from "../../components/forms/AuthInput";
import GoogleIcon from "../../components/icons/GoogleIcon";
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
import { useStyles } from "../../styles/login.styles";
import { authApi, getChallengeToken } from "../../lib/api/auth.api";

const LOGIN_BTN_WRAP = { marginTop: 6 } as const;

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

const getLoginErrorMessage = (error: any): string => {
  const status = error?.response?.status;
  const serverMsg = error?.response?.data?.message;

  if (!error?.response) {
    // not a network failure: e.g. "server did not send an access token"
    if (error?.message && error?.code !== "ERR_NETWORK") return error.message;
    return "Network error. Please check your internet connection and try again.";
  }
  if (serverMsg && typeof serverMsg === "string") return serverMsg;
  if (status === 400 || status === 401) return "Invalid email or password.";
  if (status === 404) return "Account not found.";
  if (status === 429) return "Too many attempts. Please try again later.";
  if (status >= 500) return "Server error. Please try again in a moment.";
  return error?.message || "Something went wrong. Please try again.";
};

export default function Login() {
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
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState<AlertState>(ALERT_CLOSED);

  const passwordRef = useRef<AuthInputRef>(null);

  const press = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const logoFloat = useFloat(reduce, 3200);
  const arrow = useFloat(reduce, 900);

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

  // Fully resets the form (fields + validation errors).
  const clearForm = useCallback(() => {
    setEmail("");
    setPassword("");
    setSubmitted(false);
  }, []);

  const errors = {
    email: email.trim().length < 3 ? "Enter email or username" : "",
    password: password.length < 1 ? "Enter your password" : "",
  };
  const isValid = !errors.email && !errors.password;

  const onLogin = async () => {
    if (loading) return;
    setSubmitted(true);
    if (!isValid) {
      shakeForm();
      return;
    }

    Keyboard.dismiss();

    try {
      setLoading(true);
      const res = await authApi.login({
        email: email.trim(),
        password,
      });

      // Account has 2FA: no access token yet. Verify the code first.
      const challengeToken = getChallengeToken(res);
      if (challengeToken) {
        clearForm();
        router.push({
          pathname: "/settings/two-factor-login",
          params: { challengeToken },
        } as never);
        return;
      }

      clearForm();
      router.replace("/chats" as any);
    } catch (error: any) {
      shakeForm();
      showAlert("error", "Login failed", getLoginErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = () => {
    console.log("Google sign in");
  };

  const onForgot = useCallback(
    () => router.push("/auth/reset-password"),
    [router],
  );

  const focusPassword = useCallback(() => passwordRef.current?.focus(), []);

  const onLoginRef = useRef(onLogin);
  onLoginRef.current = onLogin;
  const submitFromKeyboard = useCallback(() => {
    onLoginRef.current();
  }, []);

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
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                colors={[colors.primary, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBox}
              >
                <Ionicons
                  name="chatbubble-ellipses"
                  size={19}
                  color={colors.white}
                />
              </LinearGradient>
            </Animated.View>

            <Text style={[styles.title]} accessibilityRole="header">
              Welcome back 👋
            </Text>
            <Text style={[styles.subtitle]}>
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
              overScrollMode="never"
            >
              <View style={styles.grabber} />

              {/* No Reveal above the inputs: it caused flicker while typing. */}
              <Animated.View style={{ transform: [{ translateX: shake }] }}>
                <AuthInput
                  label="Email or Username"
                  placeholder="Enter your email or username"
                  leftIcon="mail-outline"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={focusPassword}
                  editable={!loading}
                  error={submitted ? errors.email : ""}
                />
                <AuthInput
                  ref={passwordRef}
                  label="Password"
                  placeholder="Enter your password"
                  leftIcon="lock-closed-outline"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={submitFromKeyboard}
                  rightLabel="Forgot password?"
                  onRightLabelPress={onForgot}
                  editable={!loading}
                  error={submitted ? errors.password : ""}
                />
              </Animated.View>

              <Reveal
                reduce={reduce}
                delay={420}
                from={16}
                scaleFrom={0.97}
                style={LOGIN_BTN_WRAP}
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
                      colors={[colors.primary, colors.gradientEnd]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={[styles.primaryBtn]}
                    >
                      {loading ? (
                        <ActivityIndicator color={colors.white} />
                      ) : (
                        <>
                          <Text style={[styles.primaryText]}>Log in</Text>
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

              <Reveal reduce={reduce} delay={500} from={10}>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={[styles.or]}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>
              </Reveal>

              <Reveal reduce={reduce} delay={560} from={12}>
                <Pressable
                  onPress={onGoogle}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Google"
                  style={({ pressed }) => [
                    styles.socialBtn,
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <GoogleIcon size={18} />
                  <Text style={[styles.socialText]}>Continue with Google</Text>
                </Pressable>
              </Reveal>

              <Reveal reduce={reduce} delay={620} from={8}>
                <View style={styles.footer}>
                  <Text style={[styles.footerText]}>
                    Don't have an account?{" "}
                  </Text>
                  <Pressable
                    onPress={() => router.replace("/auth/register")}
                    hitSlop={8}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel="Register"
                  >
                    <Text style={[styles.footerLink]}>Register</Text>
                  </Pressable>
                </View>
              </Reveal>
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
