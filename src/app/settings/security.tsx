import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Banner,
  Card,
  NavRow,
  Page,
  SectionLabel,
  ToggleRow,
} from "../../components/settings";

export default function Security() {
  const router = useRouter();
  const go = (p: string) => router.push(p as never);
  const { twofa } = useLocalSearchParams<{ twofa?: string }>();
  const [twoFA, setTwoFA] = useState(twofa === "on");
  const [alerts, setAlerts] = useState(true);

  useEffect(() => {
    if (twofa === "on") setTwoFA(true);
    if (twofa === "off") setTwoFA(false);
  }, [twofa]);

  return (
    <Page
      title="Account & security"
      subtitle="Password, two-factor and devices"
    >
      <Banner
        tone={twoFA ? "success" : "warn"}
        text={
          twoFA
            ? "Your account is protected with two-factor authentication."
            : "Your account isn't fully protected. Turn on two-factor authentication."
        }
      />

      <SectionLabel>Sign-in</SectionLabel>
      <Card>
        <NavRow
          icon="key-outline"
          tint={["#EDE9FE", "#6D28D9"]}
          label="Change password"
          sub="Last changed 3 months ago"
          onPress={() => go("/change-password")}
        />
        <ToggleRow
          icon="mail-outline"
          tint={["#DBEAFE", "#1D4ED8"]}
          label="New login alerts"
          sub="Email me when a new device signs in"
          value={alerts}
          onValueChange={setAlerts}
          last
        />
      </Card>

      <SectionLabel>Two-factor authentication</SectionLabel>
      <Card>
        {twoFA ? (
          <>
            <NavRow
              icon="document-text-outline"
              tint={["#FEF3C7", "#B45309"]}
              label="Recovery codes"
              sub="View or regenerate backup codes"
              onPress={() => go("/recovery-codes")}
            />
            <NavRow
              icon="log-in-outline"
              tint={["#D1FAE5", "#047857"]}
              label="Preview verification screen"
              sub="See what you'll get when signing in"
              onPress={() => go("/two-factor-login")}
            />
            <NavRow
              icon="shield-outline"
              tint={["#FEE2E2", "#B91C1C"]}
              label="Turn off two-factor"
              danger
              onPress={() => go("/two-factor-disable")}
              last
            />
          </>
        ) : (
          <NavRow
            icon="shield-checkmark-outline"
            tint={["#D1FAE5", "#047857"]}
            label="Set up two-factor"
            sub="Use an authenticator app"
            onPress={() => go("/two-factor-setup")}
            last
          />
        )}
      </Card>

      <SectionLabel>Devices</SectionLabel>
      <Card>
        <NavRow
          icon="phone-portrait-outline"
          tint={["#CFFAFE", "#0E7490"]}
          label="Active sessions"
          sub="See where you're signed in"
          value="4"
          onPress={() => go("/sessions")}
          last
        />
      </Card>

      <SectionLabel>Danger zone</SectionLabel>
      <Card>
        <NavRow
          icon="trash-outline"
          tint={["#FEE2E2", "#B91C1C"]}
          label="Delete account"
          sub="Permanently remove your account and data"
          danger
          onPress={() => go("/delete-account")}
          last
        />
      </Card>
    </Page>
  );
}
