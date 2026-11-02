import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePalette } from "../../components/ui";
import {
  Banner,
  Gap,
  HeaderPill,
  NavRow,
  ScreenHeader,
  SectionTitle,
  SettingsGroup,
  SUCCESS,
  ToggleRow,
  useSettingsStyles,
  WARN,
} from "../../components/settings/settings";

export default function Security() {
  const router = useRouter();
  const p = usePalette();
  const s = useSettingsStyles();
  const go = (path: string) => router.push(path as never);

  const { twofa } = useLocalSearchParams<{ twofa?: string }>();
  const [twoFA, setTwoFA] = useState(twofa === "on");
  const [alerts, setAlerts] = useState(true);

  useEffect(() => {
    if (twofa === "on") setTwoFA(true);
    if (twofa === "off") setTwoFA(false);
  }, [twofa]);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar style={p.isDarkBg ? "light" : "dark"} />

      <ScreenHeader
        icon="shield-checkmark"
        title="Account & security"
        subtitle="Password, two-factor and devices"
        right={
          <HeaderPill
            icon={twoFA ? "checkmark-circle" : "alert-circle"}
            label={twoFA ? "2FA on" : "2FA off"}
            color={twoFA ? SUCCESS : WARN}
            accessibilityLabel={
              twoFA ? "Two-factor is on" : "Two-factor is off"
            }
          />
        }
      />

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionTitle
          title="Status"
          icon="pulse-outline"
          hint={twoFA ? "Protected" : "Action needed"}
        />
        <Banner
          tone={twoFA ? "success" : "warn"}
          text={
            twoFA
              ? "Your account is protected with two-factor authentication."
              : "Your account isn't fully protected. Turn on two-factor authentication."
          }
        />

        <Gap />
        <SectionTitle title="Sign-in" icon="key-outline" />
        <SettingsGroup>
          <NavRow
            icon="key-outline"
            label="Change password"
            sub="Last changed 3 months ago"
            onPress={() => go("/settings/change-password")}
          />
          <ToggleRow
            icon="mail-outline"
            label="New login alerts"
            sub="Email me when a new device signs in"
            value={alerts}
            onValueChange={setAlerts}
            last
          />
        </SettingsGroup>

        <Gap />
        <SectionTitle
          title="Two-factor authentication"
          icon="shield-checkmark-outline"
          hint={twoFA ? "On" : "Off"}
        />
        <SettingsGroup>
          {twoFA ? (
            <>
              <NavRow
                icon="document-text-outline"
                label="Recovery codes"
                sub="View or regenerate backup codes"
                onPress={() => go("/settings/recovery-codes")}
              />
              <NavRow
                icon="log-in-outline"
                label="Preview verification screen"
                sub="See what you'll get when signing in"
                onPress={() => go("/settings/two-factor-login")}
              />
              <NavRow
                icon="shield-outline"
                label="Turn off two-factor"
                sub="Remove the extra layer of protection"
                danger
                onPress={() => go("/settings/two-factor-disable")}
                last
              />
            </>
          ) : (
            <NavRow
              icon="shield-checkmark-outline"
              label="Set up two-factor"
              sub="Use an authenticator app"
              onPress={() => go("/settings/two-factor-setup")}
              last
            />
          )}
        </SettingsGroup>

        <Gap />
        <SectionTitle title="Devices" icon="phone-portrait-outline" />
        <SettingsGroup>
          <NavRow
            icon="phone-portrait-outline"
            label="Active sessions"
            sub="See where you're signed in"
            value="4"
            onPress={() => go("/settings/sessions")}
            last
          />
        </SettingsGroup>

        <Gap />
        <SectionTitle title="Danger zone" icon="warning-outline" danger />
        <SettingsGroup danger>
          <NavRow
            icon="trash-outline"
            label="Delete account"
            sub="Permanently remove your account and data"
            danger
            onPress={() => go("/settings/delete-account")}
            last
          />
        </SettingsGroup>
      </ScrollView>
    </SafeAreaView>
  );
}
