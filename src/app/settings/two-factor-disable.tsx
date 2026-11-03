import React, { useMemo, useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Text, fonts, usePalette, UiPalette } from "../../components/ui";
import AppAlert from "../../components/common/AppAlert";
import {
  ActionButton,
  Hero,
  OtpInput,
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
            disabled={code.length !== 6}
            onPress={submit}
          />
        </View>
      }
    >
      <View style={st.stack}>
        <Hero
          icon="warning"
          tone="danger"
          title="Are you sure?"
          text="Without two-factor, anyone who knows your password can sign in to your account."
        />

        <View style={st.fieldSection}>
          <SectionTitle
            title="Verify it's you"
            icon="shield-checkmark-outline"
          />
          <OtpInput
            value={code}
            onChange={(v) => {
              setApiErr(undefined);
              setCode(v);
            }}
            error={errCode}
            disabled={loading}
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
    stack: { gap: 32 },
    fieldSection: { gap: 4 },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      width: "100%",
    },
    hint: {
      fontFamily: fonts.regular,
      fontSize: 11.5,
      lineHeight: 16,
      color: p.muted,
      textAlign: "center",
      marginTop: 4,
    },
  });
