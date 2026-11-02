import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
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
import * as ImagePicker from "expo-image-picker";
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
import PhotoPickerSheet from "../../components/common/PhotoPickerSheet";
import {
  Reveal,
  ShimmerSweep,
  useFloat,
  useReduceMotion,
} from "../../components/motion";
import { useTheme } from "../../theme/theme";
import { useStyles } from "../../styles/register.styles";
import { authApi } from "../../lib/api/auth.api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AFTER_REGISTER_ROUTE = "/auth/login";

const REGISTER_BTN_WRAP = { marginTop: 6 } as const;

const getPasswordStrength = (pwd: string) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0 - 4
};

const getErrorMessage = (error: any): string => {
  if (error?.response) {
    const data = error.response.data;
    const msg =
      (typeof data === "string" && data) ||
      data?.message ||
      data?.error ||
      (Array.isArray(data?.errors) && data.errors[0]?.message) ||
      "";
    if (msg) return String(msg);

    switch (error.response.status) {
      case 400:
        return "Invalid details. Please check and try again.";
      case 409:
        return "Email or username already exists.";
      case 413:
        return "Profile photo is too large. Choose a smaller one.";
      case 422:
        return "Some fields are invalid.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return `Something went wrong (${error.response.status}).`;
    }
  }
  if (error?.code === "ECONNABORTED") {
    return "Request timed out. Please try again.";
  }
  if (error?.request || error?.message === "Network Error") {
    return "Cannot reach the server. Check your internet connection.";
  }
  return error?.message || "Something went wrong. Please try again.";
};

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

export default function Register() {
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

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [alertState, setAlertState] = useState<AlertState>(ALERT_CLOSED);
  const [sheetOpen, setSheetOpen] = useState(false);

  const emailRef = useRef<AuthInputRef>(null);
  const usernameRef = useRef<AuthInputRef>(null);
  const passwordRef = useRef<AuthInputRef>(null);

  const press = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(1)).current;
  const logoFloat = useFloat(reduce, 3200);
  const arrow = useFloat(reduce, 900);

  // Strength colors ab theme se aate hain (theme change par update hote hain).
  const strengthMetaList = useMemo(
    () => [
      { label: "Too short", color: colors.border },
      { label: "Weak", color: colors.error },
      { label: "Okay", color: colors.warning },
      { label: "Good", color: colors.success },
      { label: "Strong", color: colors.success },
    ],
    [colors],
  );

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

  const avatarPressTo = useCallback(
    (v: number) =>
      Animated.spring(avatarScale, {
        toValue: v,
        useNativeDriver: true,
        friction: 6,
        tension: 220,
      }).start(),
    [avatarScale],
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

  const pickFromGallery = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showAlert(
        "warning",
        "Permission needed",
        "Profile photo choose karne ke liye gallery access allow karo.",
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled && res.assets?.length) {
      setAvatar(res.assets[0].uri);
    }
  }, [showAlert]);

  const pickFromCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showAlert(
        "warning",
        "Permission needed",
        "Photo click karne ke liye camera access allow karo.",
      );
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled && res.assets?.length) {
      setAvatar(res.assets[0].uri);
    }
  }, [showAlert]);

  // Sheet band hone ke baad picker kholo, warna iOS par picker open nahi hota.
  const runAfterSheetClose = useCallback((fn: () => void) => {
    setSheetOpen(false);
    setTimeout(fn, 320);
  }, []);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const errors = {
    fullName: fullName.trim().length < 3 ? "Enter your full name" : "",
    email: !EMAIL_REGEX.test(email.trim()) ? "Enter a valid email" : "",
    username:
      username.trim().length < 3
        ? "Min 3 characters"
        : /\s/.test(username.trim())
          ? "No spaces allowed"
          : "",
    password: password.length < 8 ? "Min 8 characters" : "",
  };
  const isValid = !Object.values(errors).some(Boolean);

  const resetForm = useCallback(() => {
    setFullName("");
    setEmail("");
    setUsername("");
    setPassword("");
    setAvatar(null);
    setSubmitted(false);
  }, []);

  const onRegister = async () => {
    if (loading) return;
    setSubmitted(true);
    if (!isValid) {
      shakeForm();
      return;
    }

    try {
      setLoading(true);
      await authApi.register({
        fullName,
        email,
        username,
        password,
        avatar: avatar ?? undefined,
      });

      // Register ho gaya: saare inputs, photo aur errors saaf.
      resetForm();

      showAlert(
        "success",
        "Account created!",
        "Aapka account ban gaya hai. Ab login karke chat start karo.",
        [
          {
            text: "Go to Login",
            variant: "primary",
            onPress: () => router.replace(AFTER_REGISTER_ROUTE as any),
          },
        ],
        false, // bahar tap / back se band nahi hoga
      );
    } catch (error: any) {
      shakeForm();
      showAlert("error", "Registration failed", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = () => {
    console.log("Google sign in");
  };

  const focusEmail = useCallback(() => emailRef.current?.focus(), []);
  const focusUsername = useCallback(() => usernameRef.current?.focus(), []);
  const focusPassword = useCallback(() => passwordRef.current?.focus(), []);

  const onRegisterRef = useRef(onRegister);
  onRegisterRef.current = onRegister;
  const submitFromKeyboard = useCallback(() => {
    onRegisterRef.current();
  }, []);

  if (!fontsLoaded) return null;

  const strengthMeta = strengthMetaList[strength];

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
              Create your account
            </Text>
            <Text style={[styles.subtitle]}>
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
              overScrollMode="never"
            >
              <View style={styles.grabber} />

              <Reveal reduce={reduce} delay={280} from={14}>
                <View style={styles.avatarSection}>
                  <Pressable
                    onPress={() => setSheetOpen(true)}
                    onPressIn={() => avatarPressTo(0.95)}
                    onPressOut={() => avatarPressTo(1)}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel={
                      avatar ? "Change profile photo" : "Add profile photo"
                    }
                  >
                    <Animated.View
                      style={[
                        styles.avatarWrap,
                        { transform: [{ scale: avatarScale }] },
                      ]}
                    >
                      <View
                        style={[
                          styles.avatarCircle,
                          avatar && styles.avatarCircleFilled,
                        ]}
                      >
                        {avatar ? (
                          <Image
                            source={{ uri: avatar }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <Ionicons
                            name="person"
                            size={40}
                            color={colors.primary}
                          />
                        )}
                      </View>

                      <LinearGradient
                        colors={[colors.primary, colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatarBadge}
                      >
                        <Ionicons
                          name={avatar ? "pencil" : "camera"}
                          size={12}
                          color={colors.white}
                        />
                      </LinearGradient>
                    </Animated.View>
                  </Pressable>

                  <Text style={[styles.avatarLabel]}>
                    {avatar ? "Tap to change photo" : "Add profile photo"}
                  </Text>
                </View>
              </Reveal>

              <Animated.View style={{ transform: [{ translateX: shake }] }}>
                <AuthInput
                  label="Full Name"
                  placeholder="John Doe"
                  leftIcon="person-outline"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={focusEmail}
                  editable={!loading}
                  valid={!!fullName && !errors.fullName}
                  error={submitted ? errors.fullName : ""}
                />
                <AuthInput
                  ref={emailRef}
                  label="Email"
                  placeholder="name@example.com"
                  leftIcon="mail-outline"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={focusUsername}
                  editable={!loading}
                  valid={!!email && !errors.email}
                  error={submitted ? errors.email : ""}
                />
                <AuthInput
                  ref={usernameRef}
                  label="Username"
                  placeholder="johndoe"
                  leftIcon="at-outline"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={focusPassword}
                  editable={!loading}
                  valid={!!username && !errors.username}
                  error={submitted ? errors.username : ""}
                />
                <AuthInput
                  ref={passwordRef}
                  label="Password"
                  placeholder="Create a password"
                  leftIcon="lock-closed-outline"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={submitFromKeyboard}
                  editable={!loading}
                  error={submitted ? errors.password : ""}
                />
              </Animated.View>

              <View
                style={[
                  styles.strengthWrap,
                  { minHeight: 18, opacity: password.length > 0 ? 1 : 0 },
                ]}
                pointerEvents="none"
              >
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            i <= strength ? strengthMeta.color : colors.border,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text
                  style={[styles.strengthLabel, { color: strengthMeta.color }]}
                >
                  {strengthMeta.label}
                </Text>
              </View>

              <Reveal
                reduce={reduce}
                delay={600}
                from={16}
                scaleFrom={0.97}
                style={REGISTER_BTN_WRAP}
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
                      colors={[colors.primary, colors.gradientEnd]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={[styles.primaryBtn]}
                    >
                      {loading ? (
                        <ActivityIndicator color={colors.white} />
                      ) : (
                        <>
                          <Text style={[styles.primaryText]}>Register</Text>
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

              <Reveal reduce={reduce} delay={680} from={10}>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={[styles.or]}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>
              </Reveal>

              <Reveal reduce={reduce} delay={740} from={12}>
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

              <Reveal reduce={reduce} delay={800} from={8}>
                <View style={styles.footer}>
                  <Text style={[styles.footerText]}>
                    Already have an account?{" "}
                  </Text>
                  <Pressable
                    onPress={() => router.replace("/auth/login")}
                    hitSlop={8}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel="Log in"
                  >
                    <Text style={[styles.footerLink]}>Login</Text>
                  </Pressable>
                </View>
              </Reveal>
            </ScrollView>
          </Reveal>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <PhotoPickerSheet
        visible={sheetOpen}
        hasPhoto={!!avatar}
        onClose={() => setSheetOpen(false)}
        onGallery={() => runAfterSheetClose(pickFromGallery)}
        onCamera={() => runAfterSheetClose(pickFromCamera)}
        onRemove={() => {
          setSheetOpen(false);
          setAvatar(null);
        }}
      />

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
