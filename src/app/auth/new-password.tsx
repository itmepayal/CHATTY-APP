import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { useTheme } from "../../theme/theme";
import { useStyles } from "../../styles/reset-password.styles";
import { authApi } from "../../lib/api/auth.api";

type AlertState = {
  visible: boolean;
  type: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
};

const ALERT_CLOSED: AlertState = { visible: false, type: "info", title: "" };

const getErrorMessage = (error: any): string => {
  const status = error?.response?.status;
  const serverMsg = error?.response?.data?.message;
  if (!error?.response) {
    return "Network error. Please check your internet connection.";
  }
  if (serverMsg && typeof serverMsg === "string") return serverMsg;
  if (status === 429) return "Too many attempts. Please try again later.";
  if (status >= 500) return "Server error. Please try again in a moment.";
  return error?.message || "Something went wrong. Please try again.";
};

export default function NewPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [alertState, setAlertState] = useState<AlertState>(ALERT_CLOSED);

  const errors = {
    password:
      password.length < 6 || password.length > 15
        ? "Password must be 6-15 characters"
        : "",
    confirm: confirmPassword !== password ? "Passwords do not match" : "",
  };
  const isValid = !errors.password && !errors.confirm;

  const goToLogin = useCallback(() => router.replace("/auth/login"), [router]);
  const goToForgot = useCallback(
    () => router.replace("/auth/reset-password"),
    [router],
  );
  const closeAlert = useCallback(
    () => setAlertState((p) => ({ ...p, visible: false })),
    [],
  );

  const onSubmit = async () => {
    if (loading) return;
    setSubmitted(true);

    if (!token) {
      setAlertState({
        visible: true,
        type: "error",
        title: "Invalid link",
        message: "Reset link invalid hai. Please naya link mangwao.",
      });
      return;
    }
    if (!isValid) return;

    Keyboard.dismiss();
    try {
      setLoading(true);
      await authApi.resetPassword({ token, password, confirmPassword });
      setPassword("");
      setConfirmPassword("");
      setSubmitted(false);
      setDone(true);
    } catch (error: any) {
      setAlertState({
        visible: true,
        type: "error",
        title: "Could not reset password",
        message: getErrorMessage(error),
        buttons: [
          { text: "Request new link", onPress: goToForgot },
          { text: "OK" },
        ] as AlertButton[],
      });
    } finally {
      setLoading(false);
    }
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
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <View style={styles.logoRing} />
              <LinearGradient
                colors={[colors.primary, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBox}
              >
                <Ionicons
                  name={done ? "checkmark-circle" : "lock-closed"}
                  size={19}
                  color={colors.white}
                />
              </LinearGradient>
            </View>
            <Text style={styles.title} accessibilityRole="header">
              {done ? "Password updated" : "Set new password"}
            </Text>
            <Text style={styles.subtitle}>
              {done
                ? "You can now log in with your new password"
                : "Choose a strong password you haven't used before"}
            </Text>
          </View>

          <View style={styles.panel}>
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

              {!done ? (
                <>
                  <AuthInput
                    label="New password"
                    placeholder="6-15 characters"
                    leftIcon="lock-closed-outline"
                    value={password}
                    onChangeText={setPassword}
                    isPassword
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    editable={!loading}
                    valid={!!password && !errors.password}
                    error={submitted ? errors.password : ""}
                  />
                  <AuthInput
                    label="Confirm password"
                    placeholder="Re-enter password"
                    leftIcon="lock-closed-outline"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    isPassword
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={onSubmit}
                    editable={!loading}
                    valid={!!confirmPassword && !errors.confirm}
                    error={submitted ? errors.confirm : ""}
                  />

                  <Pressable
                    onPress={onSubmit}
                    disabled={loading}
                    style={{ marginTop: 6 }}
                    accessibilityRole="button"
                    accessibilityLabel="Reset password"
                    accessibilityState={{ busy: loading, disabled: loading }}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.gradientEnd]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.primaryBtn}
                    >
                      {loading ? (
                        <ActivityIndicator color={colors.white} />
                      ) : (
                        <Text style={styles.primaryText}>Reset password</Text>
                      )}
                    </LinearGradient>
                  </Pressable>

                  <View style={styles.footer}>
                    <Text style={styles.footerText}>Link expired? </Text>
                    <Pressable
                      onPress={goToForgot}
                      hitSlop={8}
                      disabled={loading}
                      accessibilityRole="button"
                      accessibilityLabel="Request a new reset link"
                    >
                      <Text style={styles.footerLink}>Request new link</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <Pressable
                  onPress={goToLogin}
                  accessibilityRole="button"
                  accessibilityLabel="Back to login"
                >
                  <LinearGradient
                    colors={[colors.primary, colors.gradientEnd]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryText}>Back to login</Text>
                  </LinearGradient>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <AppAlert
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={closeAlert}
      />
    </LinearGradient>
  );
}
