import React, { useMemo, useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, fonts, usePalette, UiPalette } from "../../components/ui";
import AuthInput from "../../components/forms/AuthInput";
import {
  ActionButton,
  Hero,
  OtpInput,
  Page,
} from "../../components/settings/settings";
import { authApi, apiErrorMessage } from "../../lib/api/auth.api";

export default function TwoFactorLogin() {
  const p = usePalette();
  const router = useRouter();
  const st = useMemo(() => makeStyles(p), [p]);
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
      router.replace("/chats" as never);
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
            disabled={!valid}
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
        <Hero
          icon={useRecovery ? "key" : "shield-checkmark"}
          title={
            useRecovery ? "Enter a recovery code" : "Enter your 6-digit code"
          }
          text={
            useRecovery
              ? "Enter one of the backup codes you saved when you set up two-factor. Each code works once."
              : "Open your authenticator app and enter the current code for Chatty."
          }
        />

        <View>
          {useRecovery ? (
            <AuthInput
              key={`code-${formKey}`}
              label="Recovery code"
              leftIcon="key-outline"
              value={code}
              onChangeText={(t: string) => {
                setApiErr(undefined);
                setCode(t);
              }}
              error={err}
              placeholder="xxxxx-xxxxx"
              autoCapitalize="none"
              maxLength={11}
            />
          ) : (
            <>
              <OtpInput
                key={`otp-${formKey}`}
                value={code}
                onChange={(v) => {
                  setApiErr(undefined);
                  setCode(v);
                }}
                error={err}
                disabled={loading}
                autoFocus
              />
              <Text style={st.hint}>The code refreshes every 30 seconds.</Text>
            </>
          )}
        </View>
      </View>
    </Page>
  );
}

const makeStyles = (p: UiPalette) =>
  StyleSheet.create({
    stack: { gap: 32 },
    footerCol: { gap: 10, width: "100%" },
    hint: {
      fontFamily: fonts.regular,
      fontSize: 11.5,
      lineHeight: 16,
      color: p.muted,
      textAlign: "center",
      marginTop: 10,
    },
  });
