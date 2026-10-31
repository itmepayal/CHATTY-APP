import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  ActionSheet,
  Avatar,
  SheetAction,
  Tint,
  MUTED,
  colors,
  fonts,
} from "../../components/ui";
import {
  Banner,
  Button,
  Field,
  Page,
  useFlash,
} from "../../components/settings";

const BASE: Tint = ["#FFE8D6", "#C2410C"];
const PHOTO: Tint = ["#DBEAFE", "#1D4ED8"];
const BIO_MAX = 120;

export default function Profile() {
  const [name, setName] = useState("Payal Yadav");
  const [username, setUsername] = useState("payal");
  const [bio, setBio] = useState("Hey there! I'm using Chatty.");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [tried, setTried] = useState(false);
  const [done, flash] = useFlash();

  const errName = tried && !name.trim() ? "Name can't be empty" : undefined;
  const errUser =
    tried && !/^[a-z0-9_.]{3,20}$/i.test(username)
      ? "3–20 letters, numbers, . or _"
      : undefined;

  const save = () => {
    setTried(true);
    if (!name.trim() || !/^[a-z0-9_.]{3,20}$/i.test(username)) return;
    // UI only: PATCH /users/profile would go here
    flash();
  };

  return (
    <Page
      title="Edit profile"
      subtitle="How others see you"
      footer={<Button label="Save changes" onPress={save} />}
    >
      {done && <Banner tone="success" text="Profile saved (demo)." />}

      <View style={st.avatarWrap}>
        <Pressable
          onPress={() => setSheet(true)}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
        >
          {hasPhoto ? (
            <Avatar icon="happy" tint={PHOTO} size={96} />
          ) : (
            <Avatar name={name || "?"} tint={BASE} size={96} />
          )}
          <View style={st.camera}>
            <Ionicons name="camera" size={15} color="#fff" />
          </View>
        </Pressable>
        <Text style={st.change}>Change photo</Text>
      </View>

      <Field
        label="Full name"
        value={name}
        onChangeText={setName}
        error={errName}
        maxLength={40}
      />
      <Field
        label="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        error={errUser}
        hint="chatty.app/@"
      />
      <Field
        label="Email"
        value="payal@example.com"
        editable={false}
        hint="Email can't be changed here."
      />
      <Field
        label="Bio"
        value={bio}
        onChangeText={(t) => setBio(t.slice(0, BIO_MAX))}
        multiline
        hint={`${bio.length}/${BIO_MAX}`}
      />

      <ActionSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title="Profile photo"
        subtitle="Choose how to update it"
        avatar={<Avatar name={name || "?"} tint={BASE} size={42} />}
      >
        <SheetAction
          icon="image"
          label="Choose from gallery"
          onPress={() => {
            // UI only: PATCH /users/profile/avatar
            setHasPhoto(true);
            setSheet(false);
            flash();
          }}
        />
        {hasPhoto && (
          <SheetAction
            icon="trash"
            label="Remove photo"
            danger
            onPress={() => {
              // UI only: DELETE /users/profile/avatar
              setHasPhoto(false);
              setSheet(false);
              flash();
            }}
          />
        )}
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
  avatarWrap: { alignItems: "center", gap: 8, paddingVertical: 4 },
  camera: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  change: { fontFamily: fonts.medium, fontSize: 12.5, color: MUTED },
});
