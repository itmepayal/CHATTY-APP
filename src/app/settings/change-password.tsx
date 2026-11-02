import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { alpha } from "../../theme/theme";
import { Text, fonts, usePalette, UiPalette } from "../../components/ui";
import AuthInput from "../../components/forms/AuthInput";
import AppAlert, { AlertType } from "../../components/common/AppAlert";
import { authApi } from "../../lib/api/auth.api";
import {
  Card,
  DANGER,
  Page,
  SectionTitle,
  SUCCESS,
  WARN,
} from "../../components/settings/settings";

const RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  {
    label: "Upper & lowercase",
    test: (p) => /[A-Z]/.test(p) && /[a-z]/.test(p),
  },
  { label: "At least one number", test: (p) => /\d/.test(p) },
  { label: "At least one symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];
const LABELS = ["Too weak", "Weak", "Okay", "Good", "Strong"];
// index 0 is resolved from the palette (p.line) at render time
const STRENGTH_COLORS = [null, DANGER, WARN, "#10B981", SUCCESS] as const;

type AlertState = {
  visible: boolean;
  type: AlertType;
  title: string;
  message?: string;
  onDone?: () => void;
};

// Backend ya network error se readable message nikalta hai
const getErrorMessage = (e: any): string => {
  const status = e?.response?.status;
  const msg = e?.response?.data?.message ?? e?.response?.data?.error;
  if (typeof msg === "string" && msg.length > 0) return msg;
  if (status === 400 || status === 401 || status === 403)
    return "Your current password looks incorrect. Please try again.";
  if (!e?.response)
    return "Can't reach the server. Check your internet and try again.";
  return "Something went wrong. Please try again.";
};

export default function ChangePassword() {
  const p = usePalette();
  const router = useRouter();
  const st = useMemo(() => makeStyles(p), [p]);

  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tried, setTried] = useState(false);
  const [loading, setLoading] = useState(false);
  // success ke baad badhta hai -> inputs remount hote hain (text + eye toggle reset)
  const [formKey, setFormKey] = useState(0);
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    type: "info",
    title: "",
  });

  const passed = RULES.map((r) => r.test(next));
  const sc = passed.filter(Boolean).length;
  const hasNext = next.length > 0;
  const scColor = STRENGTH_COLORS[sc] ?? p.line;
  const matches = confirm.length > 0 && confirm === next;

  // AuthInput error ko label ke bagal me inline dikhata hai (1 line),
  // isliye messages chhote rakhe hain.
  const errCur = tried && !cur ? "Enter current password" : undefined;
  const errNext =
    tried && next.length < 8
      ? "Use at least 8 characters"
      : tried && next === cur
        ? "Must differ from current"
        : undefined;
  const errConf =
    tried && confirm !== next ? "Passwords don't match" : undefined;

  const canSubmit = !!cur && !!next && !!confirm;

  const closeAlert = () => setAlertState((a) => ({ ...a, visible: false }));

  const submit = async () => {
    if (loading) return;
    setTried(true);
    if (!cur || next.length < 8 || next === cur || confirm !== next) return;

    setLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: cur,
        newPassword: next,
        confirmPassword: confirm,
      });
      // Success: sab inputs clear + keyboard band
      Keyboard.dismiss();
      setCur("");
      setNext("");
      setConfirm("");
      setTried(false);
      setFormKey((k) => k + 1);
      setAlertState({
        visible: true,
        type: "success",
        title: "Password updated",
        message: "Your password has been changed successfully.",
        onDone: () => router.back(),
      });
    } catch (e: any) {
      setAlertState({
        visible: true,
        type: "error",
        title: "Couldn't update password",
        message: getErrorMessage(e),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page
      icon="lock-closed-outline"
      title="Change password"
      subtitle="Keep your account secure"
      footer={
        <View style={st.footerRow}>
          {/* Cancel (left) */}
          <Pressable
            onPress={() => router.back()}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            style={({ pressed }) => [
              st.btn,
              st.btnGhost,
              { flex: 1 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[st.btnText, { color: p.text }]} numberOfLines={1}>
              Cancel
            </Text>
          </Pressable>

          {/* Update password (right) */}
          <Pressable
            onPress={submit}
            disabled={!canSubmit || loading}
            accessibilityRole="button"
            accessibilityLabel="Change password"
            accessibilityState={{
              disabled: !canSubmit || loading,
              busy: loading,
            }}
            style={({ pressed }) => [
              st.btn,
              { flex: 1.4, backgroundColor: p.primary },
              !canSubmit && !loading && { opacity: 0.45 },
              pressed && canSubmit && !loading && { opacity: 0.85 },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="shield-checkmark" size={15} color="#FFFFFF" />
            )}
            <Text style={[st.btnText, { color: "#FFFFFF" }]} numberOfLines={1}>
              {loading ? "Changing..." : "Change password"}
            </Text>
          </Pressable>
        </View>
      }
    >
      <View style={st.stack}>
        {/* Intro */}
        <Card>
          <View style={st.intro}>
            <View style={st.introIcon}>
              <Ionicons name="shield-checkmark" size={20} color={p.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={st.introTitle}>Protect your account</Text>
              <Text style={st.introText}>
                Use a password you don&apos;t use anywhere else. Avoid names,
                birthdays and common words.
              </Text>
            </View>
          </View>
        </Card>

        {/* Current */}
        <View style={st.fieldSection}>
          <SectionTitle title="Verify it's you" icon="key-outline" />
          <AuthInput
            key={`cur-${formKey}`}
            label="Current password"
            isPassword
            leftIcon="key-outline"
            value={cur}
            onChangeText={setCur}
            error={errCur}
            placeholder="Enter current password"
            autoComplete="current-password"
            textContentType="password"
          />
        </View>

        {/* New */}
        <View style={st.section}>
          <SectionTitle title="New password" icon="lock-closed-outline" />
          <AuthInput
            key={`new-${formKey}`}
            label="New password"
            isPassword
            leftIcon="lock-closed-outline"
            value={next}
            onChangeText={setNext}
            error={errNext}
            placeholder="Create a new password"
            autoComplete="new-password"
            textContentType="newPassword"
          />

          {/* AuthInput ka marginBottom (12) cancel karne ke liye */}
          <View style={st.pullUp}>
            <Card>
              <View style={st.strength}>
                <View style={st.strengthHead}>
                  <Text style={st.strengthTitle}>Password strength</Text>
                  <View
                    style={[
                      st.chip,
                      {
                        backgroundColor: hasNext
                          ? alpha(scColor, 0.14)
                          : alpha(p.muted, 0.12),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        st.chipText,
                        { color: hasNext && sc > 0 ? scColor : p.muted },
                      ]}
                    >
                      {hasNext ? LABELS[sc] : "Not set"}
                    </Text>
                  </View>
                </View>

                <View style={st.bars}>
                  {[1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[
                        st.bar,
                        {
                          backgroundColor:
                            hasNext && i <= sc ? scColor : p.line,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>

              <View style={st.ruleDivider} />

              <View style={st.rules}>
                {RULES.map((r, i) => {
                  const ok = hasNext && passed[i];
                  return (
                    <View key={r.label} style={st.rule}>
                      <Ionicons
                        name={ok ? "checkmark-circle" : "ellipse-outline"}
                        size={16}
                        color={ok ? SUCCESS : p.muted}
                      />
                      <Text
                        style={[st.ruleText, ok && { color: p.text }]}
                        numberOfLines={1}
                      >
                        {r.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          </View>
        </View>

        {/* Confirm */}
        <View style={st.confirmSection}>
          <AuthInput
            key={`confirm-${formKey}`}
            label="Confirm new password"
            isPassword
            leftIcon="shield-checkmark-outline"
            value={confirm}
            onChangeText={setConfirm}
            error={errConf}
            placeholder="Re-enter new password"
            autoComplete="new-password"
            textContentType="newPassword"
          />
          {matches && (
            <View style={st.matchRow}>
              <Ionicons name="checkmark-circle" size={14} color={SUCCESS} />
              <Text style={st.matchText}>Passwords match</Text>
            </View>
          )}
        </View>
      </View>

      <AppAlert
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        dismissible={alertState.type !== "success"}
        buttons={[
          {
            text: alertState.type === "success" ? "Done" : "OK",
            variant: "primary",
            onPress: alertState.onDone,
          },
        ]}
        onClose={closeAlert}
      />
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/* Styles — only Change-password specific                              */
/* ------------------------------------------------------------------ */

const makeStyles = (p: UiPalette) =>
  StyleSheet.create({
    stack: { gap: 22 },
    section: { gap: 12 },
    // AuthInput me marginBottom: 12 hai, isliye last child ke baad extra gap cancel
    fieldSection: { gap: 12, marginBottom: -12 },
    confirmSection: { gap: 0 },
    pullUp: { marginTop: -12 },

    // Cancel (left) + Update (right) ek hi row me
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      width: "100%",
    },
    btn: {
      minWidth: 0,
      height: 44,
      borderRadius: 12,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    btnGhost: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: p.line,
    },
    btnText: {
      flexShrink: 1,
      fontFamily: fonts.semiBold,
      fontSize: 13,
      lineHeight: 18,
      includeFontPadding: false,
    },

    intro: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
    },
    introIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: alpha(p.primary, 0.14),
      alignItems: "center",
      justifyContent: "center",
    },
    introTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
      lineHeight: 19,
      color: p.text,
      includeFontPadding: false,
    },
    introText: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 17,
      color: p.muted,
      marginTop: 2,
      includeFontPadding: false,
    },

    strength: { paddingTop: 14, paddingBottom: 14, gap: 12 },
    strengthHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    strengthTitle: {
      fontFamily: fonts.medium,
      fontSize: 13,
      lineHeight: 18,
      color: p.text,
      includeFontPadding: false,
    },
    chip: {
      paddingHorizontal: 10,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    chipText: {
      fontFamily: fonts.semiBold,
      fontSize: 11.5,
      lineHeight: 16,
      includeFontPadding: false,
    },
    bars: { flexDirection: "row", gap: 6 },
    bar: { flex: 1, height: 5, borderRadius: 3 },

    ruleDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: p.line,
    },
    rules: {
      flexDirection: "row",
      flexWrap: "wrap",
      rowGap: 12,
      paddingVertical: 14,
    },
    rule: {
      width: "50%",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingRight: 6,
    },
    ruleText: {
      flexShrink: 1,
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 16,
      color: p.muted,
      includeFontPadding: false,
    },

    matchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: -6,
      marginLeft: 2,
    },
    matchText: {
      fontFamily: fonts.medium,
      fontSize: 11.5,
      lineHeight: 16,
      color: SUCCESS,
      includeFontPadding: false,
    },
  });
