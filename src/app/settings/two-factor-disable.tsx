import React, { useMemo, useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { alpha } from "../../theme/theme";
import { Text, fonts, usePalette, UiPalette } from "../../components/ui";
import AuthInput from "../../components/forms/AuthInput";
import AppAlert from "../../components/common/AppAlert";
import { ActionButton } from "../../components/settings/settings";
import {
  Card,
  DANGER,
  Page,
  SectionTitle,
} from "../../components/settings/settings";
import { authApi, apiErrorMessage } from "../../lib/api/auth.api";

export default function TwoFactorDisable() {
  const p = usePalette();
  const router = useRouter();
  const st = useMemo(() => makeStyles(p), [p]);

  const [code, setCode] = useState("");
  const [tried, setTried] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [apiErr, setApiErr] = useState<string | undefined>();

  const errCode =
    tried && code.length !== 6 ? "Enter the 6-digit code" : apiErr;

  /* POST /auth/2fa/disable  { code }  (authenticator code only) */
  const submit = async () => {
    if (loading) return;
    setTried(true);
    setApiErr(undefined);
    if (code.length !== 6) return;

    setLoading(true);
    try {
      await authApi.disable2FA({ code });
      Keyboard.dismiss();
      setDone(true);
    } catch (e: any) {
      setApiErr(apiErrorMessage(e, "Could not turn off two-factor"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page
      icon="shield-outline"
      title="Turn off two-factor"
      subtitle="Your account will be less secure"
      footer={
        <View style={st.footerRow}>
          <ActionButton
            label="Cancel"
            variant="ghost"
            flex={1}
            disabled={loading}
            onPress={() => router.back()}
          />
          <ActionButton
            label={loading ? "Turning off..." : "Turn off"}
            variant="danger"
            icon="shield-outline"
            flex={1.4}
            loading={loading}
            disabled={!code}
            onPress={submit}
          />
        </View>
      }
    >
      <View style={st.stack}>
        <Card>
          <View style={st.intro}>
            <View style={st.introIcon}>
              <Ionicons name="warning" size={20} color={DANGER} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={st.introTitle}>Are you sure?</Text>
              <Text style={st.introText}>
                Without two-factor, anyone who knows your password can sign in
                to your account.
              </Text>
            </View>
          </View>
        </Card>

        <View style={st.fieldSection}>
          <SectionTitle
            title="Verify it's you"
            icon="shield-checkmark-outline"
          />
          <AuthInput
            label="Authenticator code"
            leftIcon="keypad-outline"
            value={code}
            onChangeText={(t: string) => {
              setApiErr(undefined);
              setCode(t.replace(/\D/g, "").slice(0, 6));
            }}
            error={errCode}
            placeholder="123456"
            keyboardType="number-pad"
            autoCapitalize="none"
            maxLength={6}
          />
          <Text style={st.hint}>
            Enter the current 6-digit code from your authenticator app. Recovery
            codes can&apos;t be used here.
          </Text>
        </View>
      </View>

      <AppAlert
        visible={done}
        type="success"
        title="Two-factor turned off"
        message="Your account is no longer protected by two-step verification."
        dismissible={false}
        buttons={[
          {
            text: "Done",
            variant: "primary",
            onPress: () =>
              router.navigate({
                pathname: "/settings/security",
                params: { twofa: "off" },
              } as never),
          },
        ]}
        onClose={() => setDone(false)}
      />
    </Page>
  );
}

const makeStyles = (p: UiPalette) =>
  StyleSheet.create({
    stack: { gap: 22 },
    fieldSection: { gap: 12 },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      width: "100%",
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
      backgroundColor: alpha(DANGER, 0.14),
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
