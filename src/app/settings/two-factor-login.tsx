import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, Field, Page } from "../../components/settings";
import { MUTED, TEXT, colors, fonts } from "../../components/ui";

export default function TwoFactorLogin() {
  const router = useRouter();
  const [useRecovery, setUseRecovery] = useState(false);
  const [code, setCode] = useState("");
  const [tried, setTried] = useState(false);
  const valid = useRecovery ? code.trim().length >= 10 : code.length === 6;

  const verify = () => {
    setTried(true);
    if (!valid) return;
    // UI only: POST /auth/2fa/verify would go here
    router.replace("/" as never);
  };

  const toggle = () => {
    setUseRecovery((v) => !v);
    setCode("");
    setTried(false);
  };

  return (
    <Page
      title="Two-step verification"
      footer={
        <>
          <Button
            label="Verify and sign in"
            icon="shield-checkmark"
            onPress={verify}
          />
          <Button
            label={
              useRecovery
                ? "Use authenticator code instead"
                : "Use a recovery code instead"
            }
            variant="ghost"
            onPress={toggle}
          />
        </>
      }
    >
      <View style={st.hero}>
        <View style={st.icon}>
          <Ionicons
            name={useRecovery ? "key" : "shield-checkmark"}
            size={30}
            color={colors.primary}
          />
        </View>
        <Text style={st.h}>
          {useRecovery ? "Enter a recovery code" : "Enter your 6-digit code"}
        </Text>
        <Text style={st.p}>
          {useRecovery
            ? "Enter one of the backup codes you saved when you set up two-factor. Each code works once."
            : "Open your authenticator app and enter the current code for Chatty."}
        </Text>
      </View>
      <Field
        label={useRecovery ? "Recovery code" : "Authenticator code"}
        value={code}
        onChangeText={(t) =>
          setCode(useRecovery ? t : t.replace(/\D/g, "").slice(0, 6))
        }
        keyboardType={useRecovery ? "default" : "number-pad"}
        autoCapitalize="none"
        maxLength={useRecovery ? 11 : 6}
        placeholder={useRecovery ? "xxxxx-xxxxx" : "123456"}
        hint={useRecovery ? undefined : "The code refreshes every 30 seconds."}
        error={
          tried && !valid
            ? useRecovery
              ? "Enter your full recovery code"
              : "Enter the 6-digit code"
            : undefined
        }
      />
    </Page>
  );
}

const st = StyleSheet.create({
  hero: { alignItems: "center", gap: 8, paddingVertical: 12 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  h: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: TEXT,
    textAlign: "center",
  },
  p: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    textAlign: "center",
    paddingHorizontal: 12,
  },
});
