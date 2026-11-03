import React, { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { Text, fonts } from "../../components/ui";
import { alpha, makeUseStyles, useTheme } from "../../theme/theme";
import {
  ActionButton,
  Hero,
  Page,
  SectionTitle,
} from "../../components/settings/settings";
import { apiErrorMessage, performLogout } from "../../lib/api/auth.api";

type Scope = "this" | "all";

const OPTIONS: {
  id: Scope;
  title: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: "this",
    title: "This device only",
    sub: "You'll stay signed in on other devices",
    icon: "phone-portrait-outline",
  },
  {
    id: "all",
    title: "This and all other devices",
    sub: "Every other session will be signed out",
    icon: "laptop-outline",
  },
];

const HINTS: Record<Scope, string> = {
  this: "Only this device's session will end. Your messages stay safe on the server.",
  all: "All your other devices will be signed out too. You'll need to sign in again on them.",
};

const ICON_BOX = 38;
const ROW_PAD = 14;
const DIVIDER_INSET = ROW_PAD + ICON_BOX + 12;

const useStyles = makeUseStyles((t) => ({
  stack: { gap: 32 },
  fieldSection: { gap: 4 },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },

  group: {
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: t.colors.hairline,
    backgroundColor: t.colors.card,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 68,
    paddingVertical: 12,
    paddingHorizontal: ROW_PAD,
  },
  rowActive: { backgroundColor: alpha(t.colors.error, 0.05) },
  rowPressed: { backgroundColor: alpha(t.colors.primary, 0.05) },
  rowDisabled: { opacity: 0.6 },
  divider: {
    position: "absolute",
    left: DIVIDER_INSET,
    right: ROW_PAD,
    bottom: 0,
    height: 1,
    backgroundColor: t.colors.hairline,
  },

  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(t.colors.muted, 0.12),
  },
  iconBoxActive: { backgroundColor: alpha(t.colors.error, 0.12) },

  body: { flex: 1, minWidth: 0, marginLeft: 12 },
  title: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 19,
    letterSpacing: -0.1,
    color: t.colors.ink,
    includeFontPadding: false,
  },
  titleActive: { fontFamily: fonts.semiBold },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: t.colors.muted,
    includeFontPadding: false,
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: alpha(t.colors.muted, 0.45),
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  radioActive: { borderColor: t.colors.error },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: t.colors.error,
  },

  error: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: t.colors.error,
    textAlign: "center",
    marginTop: 12,
    includeFontPadding: false,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: t.colors.muted,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 8,
    includeFontPadding: false,
  },
}));

export default function Logout() {
  const router = useRouter();
  const st = useStyles();
  const { colors } = useTheme();

  const [scope, setScope] = useState<Scope>("this");
  const [loading, setLoading] = useState(false);
  const [apiErr, setApiErr] = useState<string | undefined>();

  // Tabs me screen mounted rehti hai, isliye har baar focus par state reset karo.
  useFocusEffect(
    useCallback(() => {
      setLoading(false);
      setApiErr(undefined);
      setScope("this");
    }, []),
  );

  const submit = async () => {
    if (loading) return;
    setLoading(true);
    setApiErr(undefined);

    try {
      await performLogout({ everywhere: scope === "all" });
      router.replace("/auth/login" as never);
    } catch (e: any) {
      setApiErr(apiErrorMessage(e, "Could not log out"));
    } finally {
      // success ho ya fail, loading hamesha band
      setLoading(false);
    }
  };

  return (
    <Page
      icon="log-out-outline"
      title="Log out"
      subtitle="End your session on Chatty"
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
            label={loading ? "Logging out..." : "Log out"}
            variant="danger"
            icon="log-out-outline"
            flex={1.4}
            loading={loading}
            onPress={submit}
          />
        </View>
      }
    >
      <View style={st.stack}>
        <Hero
          icon="warning"
          tone="danger"
          title="Log out of Chatty?"
          text="You'll need to sign in again to read your messages and calls."
        />

        <View style={st.fieldSection}>
          <SectionTitle
            title="Where to log out"
            icon="shield-checkmark-outline"
          />

          <View style={st.group} accessibilityRole="radiogroup">
            {OPTIONS.map((o, i) => {
              const active = scope === o.id;
              const last = i === OPTIONS.length - 1;

              return (
                <Pressable
                  key={o.id}
                  disabled={loading}
                  onPress={() => setScope(o.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active, disabled: loading }}
                  accessibilityLabel={`${o.title}. ${o.sub}`}
                  style={({ pressed }) => [
                    st.row,
                    active && st.rowActive,
                    pressed && !active && st.rowPressed,
                    loading && st.rowDisabled,
                  ]}
                >
                  <View style={[st.iconBox, active && st.iconBoxActive]}>
                    <Ionicons
                      name={o.icon}
                      size={18}
                      color={active ? colors.error : colors.muted}
                    />
                  </View>

                  <View style={st.body}>
                    <Text
                      style={[st.title, active && st.titleActive]}
                      numberOfLines={1}
                    >
                      {o.title}
                    </Text>
                    <Text style={st.sub} numberOfLines={1}>
                      {o.sub}
                    </Text>
                  </View>

                  <View style={[st.radio, active && st.radioActive]}>
                    {active ? <View style={st.radioDot} /> : null}
                  </View>

                  {!last && <View style={st.divider} />}
                </Pressable>
              );
            })}
          </View>

          {apiErr ? <Text style={st.error}>{apiErr}</Text> : null}

          <Text style={st.hint}>{HINTS[scope]}</Text>
        </View>
      </View>
    </Page>
  );
}
