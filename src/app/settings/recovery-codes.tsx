import React, { useState } from "react";
import { Share, StyleSheet, Text, View } from "react-native";
import {
  ActionSheet,
  Avatar,
  SheetAction,
  TEXT,
  fonts,
} from "../../components/ui";
import {
  Banner,
  Button,
  Card,
  Page,
  SectionLabel,
  useFlash,
} from "../../components/settings";

function makeCodes(n = 8) {
  const c = "abcdefghjkmnpqrstuvwxyz23456789";
  const part = () =>
    Array.from(
      { length: 5 },
      () => c[Math.floor(Math.random() * c.length)],
    ).join("");
  return Array.from({ length: n }, () => `${part()}-${part()}`);
}

export default function RecoveryCodes() {
  const [codes, setCodes] = useState(makeCodes());
  const [sheet, setSheet] = useState(false);
  const [done, flash] = useFlash();

  const regenerate = () => {
    // UI only: POST /auth/2fa/recovery-codes/regenerate would go here
    setCodes(makeCodes());
    setSheet(false);
    flash();
  };

  const share = () =>
    Share.share({
      message: `Chatty recovery codes\n\n${codes.join("\n")}`,
    }).catch(() => {});

  return (
    <Page
      title="Recovery codes"
      subtitle="Use these if you lose your authenticator"
      footer={
        <>
          <Button
            label="Share or save codes"
            icon="share-outline"
            onPress={share}
          />
          <Button
            label="Generate new codes"
            icon="refresh"
            variant="ghost"
            onPress={() => setSheet(true)}
          />
        </>
      }
    >
      {done && <Banner tone="success" text="New recovery codes generated." />}
      <Banner
        tone="warn"
        text="Each code can be used only once. Generating new codes invalidates the old ones."
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

      <ActionSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title="Generate new codes?"
        subtitle="Your old codes will stop working"
        avatar={
          <Avatar icon="refresh" tint={["#FEF3C7", "#B45309"]} size={42} />
        }
      >
        <SheetAction
          icon="refresh"
          label="Yes, generate new codes"
          onPress={regenerate}
          danger
        />
        <SheetAction
          icon="close"
          label="Cancel"
          onPress={() => setSheet(false)}
        />
      </ActionSheet>
    </Page>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 12 },
  code: {
    width: "50%",
    paddingVertical: 10,
    textAlign: "center",
    fontFamily: fonts.medium,
    fontSize: 14,
    letterSpacing: 0.5,
    color: TEXT,
  },
});
