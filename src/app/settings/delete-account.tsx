import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActionSheet,
  Avatar,
  SheetAction,
  DANGER,
  TEXT,
  MUTED,
  fonts,
} from "../../components/ui";
import {
  Banner,
  Button,
  Card,
  Field,
  Page,
  SectionLabel,
} from "../../components/settings";

const CONSEQUENCES = [
  "All your messages and media are permanently removed",
  "You're removed from every group you joined",
  "All active sessions are signed out",
  "Your username becomes available to others",
];

export default function DeleteAccount() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [word, setWord] = useState("");
  const [sheet, setSheet] = useState(false);
  const ok = pw.length > 0 && word.trim().toUpperCase() === "DELETE";

  const confirm = () => {
    setSheet(false);
    // UI only: DELETE /auth/account would go here
    router.replace("/login" as never);
  };

  return (
    <Page
      title="Delete account"
      subtitle="This action can't be undone"
      footer={
        <Button
          label="Delete my account"
          variant="danger"
          icon="trash"
          disabled={!ok}
          onPress={() => setSheet(true)}
        />
      }
    >
      <Banner
        tone="danger"
        text="Deleting your account permanently erases your profile, chats, media and settings."
      />

      <SectionLabel>What happens next</SectionLabel>
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

      <SectionLabel>Confirm it's you</SectionLabel>
      <Field
        label="Password"
        secure
        value={pw}
        onChangeText={setPw}
        autoCapitalize="none"
        placeholder="Enter your password"
      />
      <Field
        label='Type "DELETE" to confirm'
        value={word}
        onChangeText={setWord}
        autoCapitalize="characters"
        placeholder="DELETE"
        hint="This helps prevent accidental deletion."
      />

      <ActionSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title="Delete account permanently?"
        subtitle="This action cannot be undone"
        avatar={<Avatar icon="trash" tint={["#FEE2E2", "#B91C1C"]} size={42} />}
      >
        <SheetAction
          icon="trash"
          label="Yes, delete everything"
          onPress={confirm}
          danger
        />
        <SheetAction
          icon="close"
          label="Keep my account"
          onPress={() => setSheet(false)}
        />
      </ActionSheet>
    </Page>
  );
}

const st = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  itemText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
    color: TEXT,
  },
});
void MUTED;
