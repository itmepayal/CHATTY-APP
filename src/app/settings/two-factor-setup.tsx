import React, { useMemo, useState } from "react";
import { Image, Keyboard, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
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
  WARN,
} from "../../components/settings/settings";
import { authApi, apiErrorMessage } from "../../lib/api/auth.api";

const groupSecret = (s: string) =>
  s
    .replace(/\s+/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();

export default function TwoFactorSetup() {
  const p = usePalette();
  const router = useRouter();
  const st = useMemo(() => makeStyles(p), [p]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [code, setCode] = useState("");
  const [tried, setTried] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // data coming from the backend
  const [otpauthUrl, setOtpauthUrl] = useState<string | undefined>();
  const [qrImage, setQrImage] = useState<string | undefined>();
  const [secret, setSecret] = useState("");
  const [codes, setCodes] = useState<string[]>([]);

  const [setupErr, setSetupErr] = useState<string | undefined>();
  const [apiErr, setApiErr] = useState<string | undefined>();

  const errCode =
    tried && code.length !== 6 ? "Enter the 6-digit code" : apiErr;

  /* POST /auth/2fa/setup -> secret + QR */
  const startSetup = async () => {
    if (loading) return;
    setLoading(true);
    setSetupErr(undefined);
    try {
      const res = await authApi.setup2FA();
      const d = res?.data ?? res;

      setOtpauthUrl(d?.otpauthUrl ?? d?.otpauth_url ?? d?.otpauthUri);
      setQrImage(d?.qrCode ?? d?.qrCodeUrl ?? d?.qr);
      setSecret(String(d?.secret ?? d?.manualKey ?? d?.base32 ?? ""));
      setStep(2);
    } catch (e: any) {
      setSetupErr(apiErrorMessage(e, "Could not start setup"));
    } finally {
      setLoading(false);
    }
  };

  /* POST /auth/2fa/enable -> confirms code + returns recovery codes */
  const verify = async () => {
    if (loading) return;
    setTried(true);
    setApiErr(undefined);
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const res = await authApi.enable2FA({ code });
      const d = res?.data ?? res;
      const rc = d?.recoveryCodes ?? d?.backupCodes ?? d?.codes;
      if (Array.isArray(rc)) setCodes(rc.map(String));

      Keyboard.dismiss();
      setStep(3);
    } catch (e: any) {
      setApiErr(apiErrorMessage(e, "Invalid code. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const StepBars = (
    <View style={st.bars}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[st.bar, { backgroundColor: i <= step ? p.primary : p.line }]}
        />
      ))}
    </View>
  );

  const stepRow = (
    n: number,
    icon: keyof typeof Ionicons.glyphMap,
    text: string,
  ) => (
    <View key={n} style={st.stepRow}>
      <View style={st.stepIcon}>
        <Ionicons name={icon} size={16} color={p.primary} />
      </View>
      <Text style={st.stepText}>{text}</Text>
    </View>
  );

  /* ---------------- Step 1 ---------------- */
  if (step === 1)
    return (
      <Page
        icon="shield-checkmark-outline"
        title="Set up two-factor"
        subtitle="Step 1 of 3"
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
              label={loading ? "Starting..." : "Start setup"}
              icon="shield-checkmark"
              flex={1.4}
              loading={loading}
              onPress={startSetup}
            />
          </View>
        }
      >
        <View style={st.stack}>
          {StepBars}
          <Card>
            <View style={st.intro}>
              <View style={st.introIcon}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={20}
                  color={p.primary}
                />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={st.introTitle}>Add an extra layer</Text>
                <Text style={st.introText}>
                  You&apos;ll need an authenticator app like Google
                  Authenticator, Authy or 1Password.
                </Text>
              </View>
            </View>
          </Card>

          {!!setupErr && (
            <Card>
              <View style={st.intro}>
                <View
                  style={[
                    st.introIcon,
                    { backgroundColor: alpha(DANGER, 0.14) },
                  ]}
                >
                  <Ionicons name="alert-circle" size={20} color={DANGER} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={st.introTitle}>Setup failed</Text>
                  <Text style={st.introText}>{setupErr}</Text>
                </View>
              </View>
            </Card>
          )}

          <View style={st.section}>
            <SectionTitle title="How it works" icon="list-outline" />
            <Card>
              <View style={st.steps}>
                {stepRow(
                  1,
                  "qr-code-outline",
                  "Scan a QR code with your authenticator app.",
                )}
                {stepRow(
                  2,
                  "keypad-outline",
                  "Enter the 6-digit code it shows.",
                )}
                {stepRow(
                  3,
                  "key-outline",
                  "Save your recovery codes somewhere safe.",
                )}
              </View>
            </Card>
          </View>
        </View>
      </Page>
    );

  /* ---------------- Step 2 ---------------- */
  if (step === 2)
    return (
      <Page
        icon="qr-code-outline"
        title="Scan & verify"
        subtitle="Step 2 of 3"
        footer={
          <View style={st.footerRow}>
            <ActionButton
              label="Back"
              variant="ghost"
              flex={1}
              disabled={loading}
              onPress={() => {
                setStep(1);
                setCode("");
                setTried(false);
                setApiErr(undefined);
              }}
            />
            <ActionButton
              label={loading ? "Verifying..." : "Enable two-factor"}
              icon="shield-checkmark"
              flex={1.4}
              loading={loading}
              disabled={!code}
              onPress={verify}
            />
          </View>
        }
      >
        <View style={st.stack}>
          {StepBars}
          <Card>
            <View style={st.qrWrap}>
              <View style={st.qrBox}>
                {qrImage ? (
                  <Image
                    source={{ uri: qrImage }}
                    style={{ width: 176, height: 176 }}
                    resizeMode="contain"
                    accessibilityLabel="Two-factor QR code"
                  />
                ) : otpauthUrl ? (
                  <QRCode value={otpauthUrl} size={176} />
                ) : (
                  <View style={st.qrEmpty}>
                    <Ionicons name="qr-code-outline" size={40} color="#999" />
                  </View>
                )}
              </View>
              {!!secret && (
                <>
                  <Text style={st.or}>
                    Can&apos;t scan? Enter this key manually
                  </Text>
                  <Text selectable style={st.secret}>
                    {groupSecret(secret)}
                  </Text>
                </>
              )}
            </View>
          </Card>

          <View style={st.confirmSection}>
            <AuthInput
              label="6-digit code"
              leftIcon="keypad-outline"
              value={code}
              onChangeText={(t: string) => {
                setApiErr(undefined);
                setCode(t.replace(/\D/g, "").slice(0, 6));
              }}
              error={errCode}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
            />
            <Text style={st.hint}>The code changes every 30 seconds.</Text>
          </View>
        </View>
      </Page>
    );

  /* ---------------- Step 3 ---------------- */
  return (
    <Page
      icon="key-outline"
      title="Save recovery codes"
      subtitle="Step 3 of 3"
      footer={
        <ActionButton
          label="I've saved them"
          icon="checkmark"
          onPress={() => setDone(true)}
        />
      }
    >
      <View style={st.stack}>
        {StepBars}
        <Card>
          <View style={st.intro}>
            <View
              style={[st.introIcon, { backgroundColor: alpha(WARN, 0.16) }]}
            >
              <Ionicons name="warning" size={20} color={WARN} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={st.introTitle}>Keep these safe</Text>
              <Text style={st.introText}>
                Each code works once. Store them somewhere safe. You won&apos;t
                see them again.
              </Text>
            </View>
          </View>
        </Card>

        <View style={st.section}>
          <SectionTitle title="Your codes" icon="key-outline" />
          <Card>
            {codes.length ? (
              <View style={st.grid}>
                {codes.map((c) => (
                  <Text key={c} selectable style={st.code}>
                    {c}
                  </Text>
                ))}
              </View>
            ) : (
              <View style={st.intro}>
                <Text style={st.introText}>
                  No recovery codes were returned by the server.
                </Text>
              </View>
            )}
          </Card>
        </View>
      </View>

      <AppAlert
        visible={done}
        type="success"
        title="Two-factor enabled"
        message="Your account is now protected with two-step verification."
        dismissible={false}
        buttons={[
          {
            text: "Done",
            variant: "primary",
            onPress: () =>
              router.navigate({
                pathname: "/settings/security",
                params: { twofa: "on" },
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
    section: { gap: 12 },
    confirmSection: { gap: 0 },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      width: "100%",
    },

    bars: { flexDirection: "row", gap: 6 },
    bar: { flex: 1, height: 5, borderRadius: 3 },

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

    steps: { paddingVertical: 14, gap: 14 },
    stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    stepIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: alpha(p.primary, 0.12),
      alignItems: "center",
      justifyContent: "center",
    },
    stepText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: p.text,
      includeFontPadding: false,
    },

    qrWrap: { alignItems: "center", gap: 12, paddingVertical: 18 },
    qrBox: { padding: 12, backgroundColor: "#fff", borderRadius: 16 },
    qrEmpty: {
      width: 176,
      height: 176,
      alignItems: "center",
      justifyContent: "center",
    },
    or: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: p.muted,
    },
    secret: {
      fontFamily: fonts.semiBold,
      fontSize: 15,
      letterSpacing: 1.5,
      color: p.text,
      backgroundColor: alpha(p.muted, 0.12),
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      overflow: "hidden",
    },
    hint: {
      fontFamily: fonts.regular,
      fontSize: 11.5,
      lineHeight: 16,
      color: p.muted,
      marginTop: -6,
      marginLeft: 2,
    },

    grid: { flexDirection: "row", flexWrap: "wrap", paddingVertical: 10 },
    code: {
      width: "50%",
      paddingVertical: 9,
      textAlign: "center",
      fontFamily: fonts.medium,
      fontSize: 14,
      color: p.text,
    },
  });
