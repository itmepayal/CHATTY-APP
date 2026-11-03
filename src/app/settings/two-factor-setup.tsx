import React, { useMemo, useState } from "react";
import { Image, Keyboard, Share, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { alpha } from "../../theme/theme";
import { Text, fonts, usePalette, UiPalette } from "../../components/ui";
import AppAlert from "../../components/common/AppAlert";
import {
  ActionButton,
  Banner,
  Card,
  Hero,
  IntroCard,
  OtpInput,
  Page,
  SectionTitle,
  StepProgress,
} from "../../components/settings/settings";
import { authApi, apiErrorMessage } from "../../lib/api/auth.api";

const LABELS = ["Start", "Scan", "Backup"];

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

      // swagger: data.qrCodeUrl (image / data-URL) + data.manualKey
      const qr: string | undefined = d?.qrCodeUrl ?? d?.qrCode ?? d?.qr;
      if (typeof qr === "string" && qr.startsWith("otpauth://")) {
        setOtpauthUrl(qr);
        setQrImage(undefined);
      } else {
        setQrImage(qr);
        setOtpauthUrl(d?.otpauthUrl ?? d?.otpauth_url);
      }
      setSecret(String(d?.manualKey ?? d?.secret ?? d?.base32 ?? ""));
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

  const shareCodes = async () => {
    try {
      await Share.share({
        message: `Chatty recovery codes\n\n${codes.join("\n")}`,
      });
    } catch {}
  };

  const stepRow = (
    n: number,
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    text: string,
    last?: boolean,
  ) => (
    <View key={n} style={[st.stepRow, !last && st.stepRowDivider]}>
      <View style={st.stepIcon}>
        <Ionicons name={icon} size={18} color={p.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.stepTitle}>{title}</Text>
        <Text style={st.stepText}>{text}</Text>
      </View>
      <Text style={st.stepIndex}>{n}</Text>
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
          <StepProgress step={1} labels={LABELS} />

          <Hero
            icon="phone-portrait-outline"
            title="Add an extra layer"
            text="You'll need an authenticator app like Google Authenticator, Authy or 1Password."
          />

          {!!setupErr && <Banner tone="danger" text={setupErr} />}

          <View style={st.section}>
            <SectionTitle title="How it works" icon="list-outline" />
            <Card>
              {stepRow(
                1,
                "qr-code-outline",
                "Scan the QR code",
                "Use your authenticator app.",
              )}
              {stepRow(
                2,
                "keypad-outline",
                "Enter the 6-digit code",
                "It confirms the app is linked.",
              )}
              {stepRow(
                3,
                "key-outline",
                "Save recovery codes",
                "Keep them somewhere safe.",
                true,
              )}
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
              disabled={code.length !== 6}
              onPress={verify}
            />
          </View>
        }
      >
        <View style={st.stack}>
          <StepProgress step={2} labels={LABELS} />

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
              <Text style={st.qrCaption}>
                Scan this code with your authenticator app
              </Text>
              {!!secret && (
                <>
                  <Text style={st.or}>
                    Can&apos;t scan? Enter this key instead
                  </Text>
                  <Text selectable style={st.secret}>
                    {groupSecret(secret)}
                  </Text>
                </>
              )}
            </View>
          </Card>

          <View style={st.section}>
            <SectionTitle
              title="Enter the 6-digit code"
              icon="keypad-outline"
            />
            <OtpInput
              value={code}
              onChange={(v) => {
                setApiErr(undefined);
                setCode(v);
              }}
              error={errCode}
              hint="The code changes every 30 seconds."
              disabled={loading}
            />
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
        <View style={st.footerRow}>
          <ActionButton
            label="Share codes"
            variant="ghost"
            icon="share-outline"
            flex={1}
            disabled={!codes.length}
            onPress={shareCodes}
          />
          <ActionButton
            label="I've saved them"
            icon="checkmark"
            flex={1.4}
            onPress={() => setDone(true)}
          />
        </View>
      }
    >
      <View style={st.stack}>
        <StepProgress step={3} labels={LABELS} />

        <IntroCard
          icon="warning"
          tone="warn"
          title="Keep these safe"
          text="Each code works once. Store them somewhere safe. You won't see them again."
        />

        <View style={st.section}>
          <SectionTitle title="Your codes" icon="key-outline" />
          {codes.length ? (
            <View style={st.grid}>
              {codes.map((c) => (
                <View key={c} style={st.codeChip}>
                  <Text selectable style={st.code}>
                    {c}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Banner
              tone="warn"
              text="No recovery codes were returned by the server."
            />
          )}
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
    stack: { gap: 26 },
    section: { gap: 4 },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      width: "100%",
    },

    stepRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
    },
    stepRowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: p.line,
    },
    stepIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: alpha(p.primary, 0.12),
      alignItems: "center",
      justifyContent: "center",
    },
    stepTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 13.5,
      lineHeight: 18,
      color: p.text,
      includeFontPadding: false,
    },
    stepText: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 16,
      color: p.muted,
      includeFontPadding: false,
    },
    stepIndex: {
      fontFamily: fonts.semiBold,
      fontSize: 12,
      color: p.muted,
      includeFontPadding: false,
    },

    qrWrap: { alignItems: "center", gap: 12, paddingVertical: 20 },
    qrBox: {
      padding: 14,
      backgroundColor: "#fff",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: p.line,
    },
    qrEmpty: {
      width: 176,
      height: 176,
      alignItems: "center",
      justifyContent: "center",
    },
    qrCaption: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: p.text,
      textAlign: "center",
    },
    or: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: p.muted,
      marginTop: 4,
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
      textAlign: "center",
    },

    grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
    codeChip: {
      flexBasis: "48%",
      flexGrow: 1,
      paddingVertical: 13,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: p.line,
      backgroundColor: p.card,
      alignItems: "center",
    },
    code: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
      letterSpacing: 1,
      color: p.text,
    },
  });
