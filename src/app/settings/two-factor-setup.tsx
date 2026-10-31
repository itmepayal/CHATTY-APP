import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Banner,
  Body,
  Button,
  Card,
  Field,
  Page,
  SectionLabel,
} from "../../components/settings";
import { MUTED, SURFACE, TEXT, fonts } from "../../components/ui";

const SECRET = "JBSW Y3DP EHPK 3PXP";

function makeCodes(n = 8) {
  const c = "abcdefghjkmnpqrstuvwxyz23456789";
  const part = () =>
    Array.from(
      { length: 5 },
      () => c[Math.floor(Math.random() * c.length)],
    ).join("");
  return Array.from({ length: n }, () => `${part()}-${part()}`);
}

function FakeQR() {
  const N = 21;
  const cells = useMemo(() => {
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const inFinder = (r: number, c: number) =>
      (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
    return Array.from({ length: N }, (_, r) =>
      Array.from({ length: N }, (_, c) => {
        if (inFinder(r, c)) {
          const lr = r >= N - 7 ? r - (N - 7) : r;
          const lc = c >= N - 7 ? c - (N - 7) : c;
          return (
            lr === 0 ||
            lr === 6 ||
            lc === 0 ||
            lc === 6 ||
            (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4)
          );
        }
        return rnd() > 0.5;
      }),
    );
  }, []);
  return (
    <View style={st.qr} accessibilityLabel="QR code placeholder">
      {cells.map((row, r) => (
        <View key={r} style={{ flexDirection: "row" }}>
          {row.map((on, c) => (
            <View
              key={c}
              style={{
                width: 8,
                height: 8,
                backgroundColor: on ? "#111" : "#fff",
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function TwoFactorSetup() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [code, setCode] = useState("");
  const [tried, setTried] = useState(false);
  const codes = useMemo(() => makeCodes(), []);

  const finish = () =>
    router.navigate({
      pathname: "/security",
      params: { twofa: "on" },
    } as never);

  if (step === 1)
    return (
      <Page
        title="Set up two-factor"
        subtitle="Step 1 of 3"
        footer={
          <Button
            label="Start setup"
            icon="shield-checkmark"
            onPress={() => setStep(2)}
          />
        }
      >
        <Banner
          tone="info"
          text="You'll need an authenticator app like Google Authenticator, Authy or 1Password."
        />
        <Card>
          <View style={st.pad}>
            <Body>
              1. Scan a QR code with your authenticator app.{"\n"}
              2. Enter the 6-digit code it shows.{"\n"}
              3. Save your recovery codes somewhere safe.
            </Body>
          </View>
        </Card>
      </Page>
    );

  if (step === 2)
    return (
      <Page
        title="Scan & verify"
        subtitle="Step 2 of 3"
        footer={
          <Button
            label="Enable two-factor"
            onPress={() => {
              setTried(true);
              if (code.length === 6) setStep(3);
            }}
          />
        }
      >
        <View style={st.center}>
          <FakeQR />
          <Text style={st.or}>Can't scan? Enter this key manually</Text>
          <Text selectable style={st.secret}>
            {SECRET}
          </Text>
        </View>
        <Field
          label="6-digit code"
          value={code}
          onChangeText={(t: any) => setCode(t.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="123456"
          error={
            tried && code.length !== 6 ? "Enter the 6-digit code" : undefined
          }
          hint="The code changes every 30 seconds."
        />
      </Page>
    );

  return (
    <Page
      title="Save recovery codes"
      subtitle="Step 3 of 3"
      footer={
        <Button label="I've saved them" icon="checkmark" onPress={finish} />
      }
    >
      <Banner
        tone="warn"
        text="Each code works once. Store them somewhere safe. You won't see them again."
      />
      <SectionLabel>Your codes</SectionLabel>
      <Card>
        <View style={st.grid}>
          {codes.map((c) => (
            <Text key={c} selectable style={st.code}>
              {c}
            </Text>
          ))}
        </View>
      </Card>
    </Page>
  );
}

const st = StyleSheet.create({
  pad: { padding: 16 },
  center: { alignItems: "center", gap: 12 },
  qr: { padding: 12, backgroundColor: "#fff", borderRadius: 16 },
  or: { fontFamily: fonts.regular, fontSize: 12, color: MUTED },
  secret: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    letterSpacing: 1.5,
    color: TEXT,
    backgroundColor: SURFACE,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 12 },
  code: {
    width: "50%",
    paddingVertical: 8,
    textAlign: "center",
    fontFamily: fonts.medium,
    fontSize: 14,
    color: TEXT,
  },
});
