import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Banner,
  Button,
  Card,
  Field,
  Page,
  SectionLabel,
  useFlash,
} from "../../components/settings";
import { MUTED, LINE, TEXT, fonts } from "../../components/ui";

const RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  {
    label: "Upper and lowercase letters",
    test: (p) => /[A-Z]/.test(p) && /[a-z]/.test(p),
  },
  { label: "At least one number", test: (p) => /\d/.test(p) },
  { label: "At least one symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];
const LABELS = ["Too weak", "Weak", "Okay", "Good", "Strong"];
const COLORS = [LINE, "#DC2626", "#F59E0B", "#10B981", "#059669"];

export default function ChangePassword() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tried, setTried] = useState(false);
  const [done, flash] = useFlash();

  const passed = RULES.map((r) => r.test(next));
  const sc = passed.filter(Boolean).length;

  const errCur = tried && !cur ? "Enter your current password" : undefined;
  const errNext =
    tried && next.length < 8
      ? "Use at least 8 characters"
      : tried && next === cur
        ? "New password must be different from the current one"
        : undefined;
  const errConf =
    tried && confirm !== next ? "Passwords don't match" : undefined;

  const submit = () => {
    setTried(true);
    if (!cur || next.length < 8 || next === cur || confirm !== next) return;
    // UI only: PATCH /auth/change-password would go here
    flash();
    setCur("");
    setNext("");
    setConfirm("");
    setTried(false);
  };

  return (
    <Page
      title="Change password"
      subtitle="Choose a strong, unique password"
      footer={
        <Button label="Update password" icon="lock-closed" onPress={submit} />
      }
    >
      {done && <Banner tone="success" text="Your password has been updated." />}

      <Field
        label="Current password"
        secure
        value={cur}
        onChangeText={setCur}
        error={errCur}
        placeholder="Enter current password"
        autoCapitalize="none"
      />
      <Field
        label="New password"
        secure
        value={next}
        onChangeText={setNext}
        error={errNext}
        placeholder="Create a new password"
        autoCapitalize="none"
      />

      {next.length > 0 && (
        <>
          <View style={st.meter}>
            <View style={st.bars}>
              {[1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={[
                    st.bar,
                    { backgroundColor: i <= sc ? COLORS[sc] : LINE },
                  ]}
                />
              ))}
            </View>
            <Text
              style={[st.meterText, { color: sc > 0 ? COLORS[sc] : MUTED }]}
            >
              {LABELS[sc]}
            </Text>
          </View>
          <Card>
            <View style={st.rules}>
              {RULES.map((r, i) => (
                <View key={r.label} style={st.rule}>
                  <Ionicons
                    name={passed[i] ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={passed[i] ? "#059669" : MUTED}
                  />
                  <Text style={[st.ruleText, passed[i] && { color: TEXT }]}>
                    {r.label}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </>
      )}

      <Field
        label="Confirm new password"
        secure
        value={confirm}
        onChangeText={setConfirm}
        error={errConf}
        placeholder="Re-enter new password"
        autoCapitalize="none"
        hint={
          confirm.length > 0 && confirm === next ? "Passwords match" : undefined
        }
      />
    </Page>
  );
}

const st = StyleSheet.create({
  meter: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: -6 },
  bars: { flex: 1, flexDirection: "row", gap: 6 },
  bar: { flex: 1, height: 5, borderRadius: 3 },
  meterText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    width: 64,
    textAlign: "right",
  },
  rules: { padding: 14, gap: 10 },
  rule: { flexDirection: "row", alignItems: "center", gap: 10 },
  ruleText: { fontFamily: fonts.regular, fontSize: 12.5, color: MUTED },
});
