import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { usePalette } from "../../components/ui";
import {
  Banner,
  Gap,
  HeaderPill,
  IntroCard,
  NavRow,
  ScreenHeader,
  SectionTitle,
  SettingsGroup,
  SUCCESS,
  ToggleRow,
  useSettingsStyles,
  WARN,
} from "../../components/settings/settings";
import { authApi, apiErrorMessage } from "../../lib/api/auth.api";

export default function Security() {
  const router = useRouter();
  const p = usePalette();
  const s = useSettingsStyles();
  const go = (path: string) => router.push(path as never);

  const { twofa } = useLocalSearchParams<{ twofa?: string }>();
  const [twoFA, setTwoFA] = useState(twofa === "on");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [sessionCount, setSessionCount] = useState<number | null>(null);

  const [alerts, setAlerts] = useState(true);
  const [alertErr, setAlertErr] = useState<string | undefined>();
  const savingAlerts = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        const [status, count] = await Promise.all([
          authApi.getSecurityStatus(),
          authApi
            .getSessions()
            .then((list) => list.length)
            .catch(() => null),
        ]);

        if (!active) return;

        if (status.twoFactorEnabled !== null) {
          setTwoFA(status.twoFactorEnabled);
        } else {
          if (twofa === "on") setTwoFA(true);
          if (twofa === "off") setTwoFA(false);
        }

        if (status.loginAlerts !== null && !savingAlerts.current) {
          setAlerts(status.loginAlerts);
        }

        setSessionCount(count);
        setLoadingStatus(false);
      })();

      return () => {
        active = false;
      };
    }, [twofa]),
  );

  const changeAlerts = async (next: boolean) => {
    if (savingAlerts.current) return;

    const prev = alerts;
    savingAlerts.current = true;
    setAlertErr(undefined);
    setAlerts(next);

    try {
      const saved = await authApi.setLoginAlerts(next);
      setAlerts(saved);
    } catch (e: any) {
      setAlerts(prev);
      setAlertErr(apiErrorMessage(e, "Could not update login alerts"));
    } finally {
      savingAlerts.current = false;
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar style={p.isDarkBg ? "light" : "dark"} />

      <ScreenHeader
        icon="shield-checkmark"
        title="Account & security"
        subtitle="Password, two-factor and devices"
        right={
          loadingStatus ? (
            <ActivityIndicator size="small" />
          ) : (
            <HeaderPill
              icon={twoFA ? "checkmark-circle" : "alert-circle"}
              label={twoFA ? "2FA on" : "2FA off"}
              color={twoFA ? SUCCESS : WARN}
              accessibilityLabel={
                twoFA ? "Two-factor is on" : "Two-factor is off"
              }
            />
          )
        }
      />

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <IntroCard
          icon={twoFA ? "shield-checkmark" : "shield-half-outline"}
          tone={twoFA ? "success" : "warn"}
          title={twoFA ? "Your account is protected" : "Action needed"}
          text={
            twoFA
              ? "Two-factor authentication is active on this account."
              : "Turn on two-factor authentication to secure your account."
          }
        />

        {!!alertErr && (
          <>
            <Gap />
            <Banner tone="danger" text={alertErr} />
          </>
        )}

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
            onValueChange={changeAlerts}
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
            value={sessionCount !== null ? String(sessionCount) : undefined}
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
