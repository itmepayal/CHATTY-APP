import React, { useEffect, useMemo, useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, fonts, usePalette, UiPalette } from "../../components/ui";
import AuthInput from "../../components/forms/AuthInput";
import AppAlert from "../../components/common/AppAlert";
import {
  ActionButton,
  Banner,
  Card,
  Hero,
  OtpInput,
  Page,
  SectionTitle,
} from "../../components/settings/settings";
import { authApi, apiErrorMessage } from "../../lib/api/auth.api";

const DANGER = "#E5484D";

const CONSEQUENCES = [
  "All your messages and uploaded images are permanently removed",
  "You're removed from every group you joined",
  "All active sessions are signed out",
  "Your username becomes available to others",
];

export default function DeleteAccount() {
  const p = usePalette();
  const router = useRouter();
  const st = useMemo(() => makeStyles(p), [p]);

  const [password, setPassword] = useState("");
  const [word, setWord] = useState("");
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const [twoFA, setTwoFA] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  const [tried, setTried] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [apiErr, setApiErr] = useState<string | undefined>();

  useEffect(() => {
    let active = true;
    (async () => {
      const enabled = await authApi.get2FAStatus();
      if (!active) return;
      setTwoFA(enabled === true);
      setStatusLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const wordOk = word.trim().toUpperCase() === "DELETE";
  const passOk = password.length > 0;
  const codeOk = !twoFA
    ? true
    : useRecovery
      ? code.trim().length >= 10
      : code.length === 6;

  const valid = passOk && wordOk && codeOk;

  const passErr = tried && !passOk ? "Enter your password" : undefined;
  const wordErr = tried && !wordOk ? 'Type "DELETE" exactly' : undefined;
  const codeErr =
    tried && !codeOk
      ? useRecovery
        ? "Enter your full recovery code"
        : "Enter the 6-digit code"
      : undefined;

  const askConfirm = () => {
    if (loading || statusLoading) return;
    setTried(true);
    setApiErr(undefined);
    if (!valid) return;
    Keyboard.dismiss();
    setConfirm(true);
  };

  const submit = async () => {
    if (loading) return;
    setLoading(true);
    setApiErr(undefined);

    try {
      await authApi.deleteAccount({
        confirmation: "DELETE",
        password,
        code: twoFA ? code : undefined,
        useRecoveryCode: twoFA ? useRecovery : undefined,
      });
      setConfirm(false);
      setDone(true);
    } catch (e: any) {
      setConfirm(false);
      setApiErr(apiErrorMessage(e, "Could not delete your account"));
    } finally {
      setLoading(false);
    }
  };

  const toggleRecovery = () => {
    setUseRecovery((v) => !v);
    setCode("");
    setTried(false);
    setApiErr(undefined);
    setFormKey((k) => k + 1);
  };

  return (
    <Page
      icon="trash-outline"
      title="Delete account"
      subtitle="This action can't be undone"
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
            label="Delete account"
            variant="danger"
            icon="trash-outline"
            flex={1.4}
            loading={loading}
            disabled={!valid || statusLoading}
            onPress={askConfirm}
          />
        </View>
      }
    >
      <View style={st.stack}>
        <Hero
          icon="warning"
          tone="danger"
          title="Are you sure?"
          text="Deleting your account permanently erases your profile, chats, media and settings."
        />

        {!!apiErr && <Banner tone="danger" text={apiErr} />}

        <View style={st.section}>
          <SectionTitle title="What happens next" icon="list-outline" />
          <Card>
            <View style={st.list}>
              {CONSEQUENCES.map((c) => (
                <View key={c} style={st.item}>
                  <Ionicons name="close-circle" size={17} color={DANGER} />
                  <Text style={st.itemText}>{c}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        <View style={st.section}>
          <SectionTitle
            title="Verify it's you"
            icon="shield-checkmark-outline"
          />

          <View style={st.fields}>
            <AuthInput
              label="Password"
              leftIcon="lock-closed-outline"
              value={password}
              onChangeText={(t: string) => {
                setApiErr(undefined);
                setPassword(t);
              }}
              error={passErr}
              placeholder="Enter your password"
              autoCapitalize="none"
              secureTextEntry
            />

            <AuthInput
              label='Type "DELETE" to confirm'
              leftIcon="trash-outline"
              value={word}
              onChangeText={(t: string) => {
                setApiErr(undefined);
                setWord(t);
              }}
              error={wordErr}
              placeholder="DELETE"
              autoCapitalize="characters"
            />
          </View>
        </View>

        {twoFA && (
          <View style={st.section}>
            <SectionTitle
              title={useRecovery ? "Recovery code" : "Two-factor code"}
              icon="key-outline"
            />

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
                error={codeErr}
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
                  error={codeErr}
                  disabled={loading}
                />
                <Text style={st.hint}>
                  Enter the current 6-digit code from your authenticator app.
                </Text>
              </>
            )}

            <View style={{ marginTop: 6 }}>
              <ActionButton
                label={
                  useRecovery
                    ? "Use authenticator code instead"
                    : "Use a recovery code instead"
                }
                variant="ghost"
                disabled={loading}
                onPress={toggleRecovery}
              />
            </View>
          </View>
        )}
      </View>

      {/* Final confirm */}
      <AppAlert
        visible={confirm}
        type="warning"
        title="Delete account?"
        message="This will permanently erase your account. You can't undo this."
        dismissible={!loading}
        buttons={[
          {
            text: loading ? "Deleting..." : "Delete",
            variant: "primary",
            onPress: submit,
          },
          {
            text: "Cancel",
            variant: "secondary",
            onPress: () => !loading && setConfirm(false),
          },
        ]}
        onClose={() => !loading && setConfirm(false)}
      />

      {/* Success */}
      <AppAlert
        visible={done}
        type="success"
        title="Account deleted"
        message="Your account has been permanently deleted."
        dismissible={false}
        buttons={[
          {
            text: "Done",
            variant: "primary",
            onPress: () => router.replace("/" as never),
          },
        ]}
        onClose={() => setDone(false)}
      />
    </Page>
  );
}

const makeStyles = (p: UiPalette) =>
  StyleSheet.create({
    stack: { gap: 28 },
    section: { gap: 4 },
    fields: { gap: 14 },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      width: "100%",
    },
    list: { padding: 16, gap: 12 },
    item: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    itemText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 13.5,
      lineHeight: 19,
      color: p.text,
    },
    hint: {
      fontFamily: fonts.regular,
      fontSize: 11.5,
      lineHeight: 16,
      color: p.muted,
      textAlign: "center",
      marginTop: 10,
    },
  });
