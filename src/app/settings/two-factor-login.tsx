import React, { useMemo, useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { alpha } from "../../theme/theme";
import { Text, fonts, usePalette, UiPalette } from "../../components/ui";
import AuthInput from "../../components/forms/AuthInput";
import { ActionButton } from "../../components/settings/settings";
import { Card, Page } from "../../components/settings/settings";
import { authApi, apiErrorMessage } from "../../lib/api/auth.api";

export default function TwoFactorLogin() {
  const p = usePalette();
  const router = useRouter();
  const st = useMemo(() => makeStyles(p), [p]);
  // The login screen pushes here with: params: { challengeToken }
  const { challengeToken } = useLocalSearchParams<{
    challengeToken?: string;
  }>();

  const [useRecovery, setUseRecovery] = useState(false);
  const [code, setCode] = useState("");
  const [tried, setTried] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [apiErr, setApiErr] = useState<string | undefined>();

  const valid = useRecovery ? code.trim().length >= 10 : code.length === 6;
  const err =
    tried && !valid
      ? useRecovery
        ? "Enter your full recovery code"
        : "Enter the 6-digit code"
      : apiErr;

  /* POST /auth/2fa/verify-login { challengeToken, code, useRecoveryCode } */
  const verify = async () => {
    if (loading) return;
    setTried(true);
    setApiErr(undefined);
    if (!valid) return;

    if (typeof challengeToken !== "string" || !challengeToken) {
      setApiErr("Your sign-in session expired. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      await authApi.verify2FALogin({
        challengeToken,
        code: code.trim(),
        useRecoveryCode: useRecovery,
      });
      Keyboard.dismiss();
      router.replace("/" as never);
    } catch (e: any) {
      setApiErr(apiErrorMessage(e, "Invalid code. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    setUseRecovery((v) => !v);
    setCode("");
    setTried(false);
    setApiErr(undefined);
    setFormKey((k) => k + 1);
  };

  return (
    <Page
      icon="shield-checkmark-outline"
      title="Two-step verification"
      subtitle="Confirm it's really you"
      footer={
        <View style={st.footerCol}>
          <ActionButton
            label={loading ? "Verifying..." : "Verify and sign in"}
            icon="shield-checkmark"
            loading={loading}
            disabled={!code}
            onPress={verify}
          />
          <ActionButton
            label={
              useRecovery
                ? "Use authenticator code instead"
                : "Use a recovery code instead"
            }
            variant="ghost"
            disabled={loading}
            onPress={toggle}
          />
        </View>
      }
    >
      <View style={st.stack}>
        <Card>
          <View style={st.intro}>
            <View style={st.introIcon}>
              <Ionicons
                name={useRecovery ? "key" : "shield-checkmark"}
                size={20}
                color={p.primary}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={st.introTitle}>
                {useRecovery
                  ? "Enter a recovery code"
                  : "Enter your 6-digit code"}
              </Text>
              <Text style={st.introText}>
                {useRecovery
                  ? "Enter one of the backup codes you saved when you set up two-factor. Each code works once."
                  : "Open your authenticator app and enter the current code for Chatty."}
              </Text>
            </View>
          </View>
        </Card>

        <View style={st.confirmSection}>
          <AuthInput
            key={`code-${formKey}`}
            label={useRecovery ? "Recovery code" : "Authenticator code"}
            leftIcon={useRecovery ? "key-outline" : "keypad-outline"}
            value={code}
            onChangeText={(t: string) => {
              setApiErr(undefined);
              setCode(useRecovery ? t : t.replace(/\D/g, "").slice(0, 6));
            }}
            error={err}
            placeholder={useRecovery ? "xxxxx-xxxxx" : "123456"}
            keyboardType={useRecovery ? "default" : "number-pad"}
            autoCapitalize="none"
            maxLength={useRecovery ? 11 : 6}
          />
          {!useRecovery && (
            <Text style={st.hint}>The code refreshes every 30 seconds.</Text>
          )}
        </View>
      </View>
    </Page>
  );
}

const makeStyles = (p: UiPalette) =>
  StyleSheet.create({
    stack: { gap: 22 },
    confirmSection: { gap: 0 },
    footerCol: { gap: 10, width: "100%" },
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
    hint: {
      fontFamily: fonts.regular,
      fontSize: 11.5,
      lineHeight: 16,
      color: p.muted,
      marginTop: -6,
      marginLeft: 2,
    },
  });
