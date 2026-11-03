import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { alpha } from "../../theme/theme";
import { Text, fonts, usePalette, UiPalette } from "../../components/ui";
import AppAlert from "../../components/common/AppAlert";
import {
  ActionButton,
  Banner,
  Hero,
  Page,
  SectionTitle,
} from "../../components/settings/settings";
import { authApi, apiErrorMessage, SessionItem } from "../../lib/api/auth.api";

const DANGER = "#E5484D";
const GREEN = "#10B981";
const GREEN_TEXT = "#047857";

type IconName = keyof typeof Ionicons.glyphMap;

type Session = {
  id: string;
  title: string;
  subtitle: string;
  kind: string;
  location: string;
  last: string;
  signedIn: string;
  icon: IconName;
  current: boolean;
  time: number;
};

const toIcon = (type?: string): IconName => {
  if (type === "desktop") return "laptop-outline";
  if (type === "tablet") return "tablet-portrait-outline";
  return "phone-portrait-outline";
};

const toKind = (type?: string) => {
  if (type === "desktop") return "Computer";
  if (type === "tablet") return "Tablet";
  return "Phone";
};

const fmtDate = (s?: string) => {
  if (!s) return "";
  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const toSession = (x: SessionItem): Session => {
  const title =
    x.device ||
    [x.browser, x.os].filter(Boolean).join(" on ") ||
    "Unknown device";

  const t = x.lastActivity ? new Date(x.lastActivity).getTime() : 0;

  return {
    id: x.id,
    title,
    subtitle: [x.browser, x.os].filter(Boolean).join(" · "),
    kind: toKind(x.deviceType),
    location: x.location || "Unknown location",
    last: x.lastActiveLabel || "Recently active",
    signedIn: fmtDate(x.createdAt),
    icon: toIcon(x.deviceType),
    current: !!x.current,
    time: Number.isFinite(t) ? t : 0,
  };
};

/* ---------- small pieces ---------- */

function Chip({
  icon,
  label,
  tone = "muted",
  p,
}: {
  icon: IconName;
  label: string;
  tone?: "muted" | "green";
  p: UiPalette;
}) {
  const color = tone === "green" ? GREEN_TEXT : p.muted;
  const bg = tone === "green" ? alpha(GREEN, 0.14) : alpha(p.muted, 0.1);
  return (
    <View style={[chipStyles.chip, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text
        numberOfLines={1}
        style={[chipStyles.text, { color, fontFamily: fonts.medium }]}
      >
        {label}
      </Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    maxWidth: "100%",
  },
  text: { fontSize: 11.5, lineHeight: 15, includeFontPadding: false },
});

function SkeletonCard({ p }: { p: UiPalette }) {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const bar = (w: number | string, h = 10) => (
    <View
      style={{
        width: w as any,
        height: h,
        borderRadius: 6,
        backgroundColor: alpha(p.muted, 0.18),
      }}
    />
  );

  return (
    <Animated.View
      style={{
        opacity: pulse,
        padding: 14,
        gap: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: p.line,
        backgroundColor: p.card,
      }}
    >
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: alpha(p.muted, 0.18),
          }}
        />
        <View style={{ flex: 1, gap: 8 }}>
          {bar("60%", 12)}
          {bar("38%")}
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {bar(90, 22)}
        {bar(80, 22)}
      </View>
    </Animated.View>
  );
}

/* ---------- screen ---------- */

export default function Sessions() {
  const p = usePalette();
  const st = useMemo(() => makeStyles(p), [p]);

  const [list, setList] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [msg, setMsg] = useState<string | undefined>();

  const [target, setTarget] = useState<Session | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const load = useCallback(async () => {
    setErr(undefined);
    try {
      const data = await authApi.getSessions();
      const mapped = data.map(toSession).sort((a, b) => {
        if (a.current && !b.current) return -1;
        if (!a.current && b.current) return 1;
        return b.time - a.time;
      });
      setList(mapped);
    } catch (e: any) {
      setErr(apiErrorMessage(e, "Could not load sessions"));
    } finally {
      setLoading(false);
    }
  }, []);

  // Har baar screen focus hone par fresh list
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setMsg(undefined);
      load();
    }, [load]),
  );

  // Success message 4 second baad apne aap hat jaye
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(undefined), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  const current = useMemo(() => list.find((x) => x.current), [list]);
  const others = useMemo(() => list.filter((x) => !x.current), [list]);

  /* DELETE /auth/sessions/:id */
  const revokeOne = async () => {
    if (!target || busy) return;
    const s = target;

    setBusy(true);
    setErr(undefined);
    setMsg(undefined);

    try {
      await authApi.revokeSession(s.id);
      setList((l) => l.filter((x) => x.id !== s.id));
      setMsg(`${s.title} has been signed out.`);
    } catch (e: any) {
      setErr(apiErrorMessage(e, "Could not sign out this device"));
      // 404 = session pehle hi hat chuka hai, list refresh kar do
      if (e?.response?.status === 404) load();
    } finally {
      setBusy(false);
      setTarget(null);
    }
  };

  /* POST /auth/sessions/revoke-others */
  const revokeAll = async () => {
    if (busy) return;

    setBusy(true);
    setErr(undefined);
    setMsg(undefined);

    try {
      const n = await authApi.revokeOtherSessions();
      await load();
      setMsg(
        n > 0
          ? `Signed out of ${n} other ${n === 1 ? "device" : "devices"}.`
          : "No other devices were signed in.",
      );
    } catch (e: any) {
      setErr(apiErrorMessage(e, "Could not sign out other devices"));
    } finally {
      setBusy(false);
      setConfirmAll(false);
    }
  };

  /* ---------- cards ---------- */

  const renderCurrent = (s: Session) => (
    <View style={st.currentCard}>
      <View style={st.topRow}>
        <View style={[st.iconBox, st.iconBoxCurrent]}>
          <Ionicons name={s.icon} size={22} color={p.primary} />
        </View>

        <View style={st.info}>
          <Text style={st.name} numberOfLines={1}>
            {s.title}
          </Text>
          {!!s.subtitle && (
            <Text style={st.meta} numberOfLines={1}>
              {s.subtitle}
            </Text>
          )}
        </View>

        <View style={st.badge}>
          <Text style={st.badgeText}>This device</Text>
        </View>
      </View>

      <View style={st.chipRow}>
        <Chip icon="ellipse" label="Active now" tone="green" p={p} />
        <Chip icon="location-outline" label={s.location} p={p} />
        {!!s.signedIn && (
          <Chip icon="calendar-outline" label={`Since ${s.signedIn}`} p={p} />
        )}
      </View>
    </View>
  );

  const renderOther = (s: Session) => (
    <View key={s.id} style={st.card}>
      <View style={st.topRow}>
        <View style={st.iconBox}>
          <Ionicons name={s.icon} size={22} color={p.muted} />
        </View>

        <View style={st.info}>
          <Text style={st.name} numberOfLines={1}>
            {s.title}
          </Text>
          <Text style={st.meta} numberOfLines={1}>
            {[s.kind, s.subtitle].filter(Boolean).join(" · ")}
          </Text>
        </View>
      </View>

      <View style={st.chipRow}>
        <Chip icon="time-outline" label={s.last} p={p} />
        <Chip icon="location-outline" label={s.location} p={p} />
        {!!s.signedIn && (
          <Chip icon="calendar-outline" label={`Since ${s.signedIn}`} p={p} />
        )}
      </View>

      <Pressable
        onPress={() => setTarget(s)}
        disabled={busy}
        style={({ pressed }) => [
          st.signOutBtn,
          (pressed || busy) && { opacity: 0.6 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Sign out ${s.title}`}
      >
        <Ionicons name="log-out-outline" size={16} color={DANGER} />
        <Text style={st.signOutText}>Sign out this device</Text>
      </Pressable>
    </View>
  );

  return (
    <Page
      icon="phone-portrait-outline"
      title="Active sessions"
      subtitle={
        loading
          ? "Loading..."
          : `${list.length} device${list.length === 1 ? "" : "s"} signed in`
      }
      footer={
        <View style={st.footerCol}>
          <ActionButton
            label={
              busy && confirmAll
                ? "Signing out..."
                : "Sign out all other devices"
            }
            variant="danger"
            icon="log-out-outline"
            loading={busy && confirmAll}
            disabled={loading || busy || others.length === 0}
            onPress={() => setConfirmAll(true)}
          />
        </View>
      }
    >
      <View style={st.stack}>
        <Hero
          icon="shield-checkmark"
          title="Keep your account safe"
          text="If you don't recognise a device, sign it out and change your password."
        />

        {!!err && <Banner tone="danger" text={err} />}
        {!!msg && <Banner tone="success" text={msg} />}

        {loading ? (
          <View style={st.section}>
            <SectionTitle title="This device" icon="checkmark-circle-outline" />
            <SkeletonCard p={p} />
            <View style={{ height: 14 }} />
            <SectionTitle title="Other devices" icon="phone-portrait-outline" />
            <View style={st.list}>
              <SkeletonCard p={p} />
              <SkeletonCard p={p} />
            </View>
          </View>
        ) : (
          <>
            <View style={st.section}>
              <SectionTitle
                title="This device"
                icon="checkmark-circle-outline"
              />
              {current ? (
                renderCurrent(current)
              ) : (
                <Text style={st.empty}>
                  Current device could not be identified.
                </Text>
              )}
            </View>

            <View style={st.section}>
              <SectionTitle
                title="Other devices"
                icon="phone-portrait-outline"
                hint={others.length ? String(others.length) : undefined}
              />
              {others.length === 0 ? (
                <View style={st.emptyBox}>
                  <View style={st.emptyIcon}>
                    <Ionicons
                      name="shield-checkmark"
                      size={26}
                      color={GREEN_TEXT}
                    />
                  </View>
                  <Text style={st.emptyTitle}>All clear</Text>
                  <Text style={st.empty}>
                    You're signed in on this device only.
                  </Text>
                </View>
              ) : (
                <View style={st.list}>{others.map(renderOther)}</View>
              )}
            </View>
          </>
        )}
      </View>

      {/* Ek device sign out */}
      <AppAlert
        visible={!!target}
        type="warning"
        title="Sign out this device?"
        message={`${target?.title ?? "This device"} will be signed out and will need to log in again.`}
        dismissible={!busy}
        buttons={[
          {
            text: busy ? "Signing out..." : "Sign out",
            variant: "primary",
            onPress: revokeOne,
          },
          {
            text: "Cancel",
            variant: "secondary",
            onPress: () => !busy && setTarget(null),
          },
        ]}
        onClose={() => !busy && setTarget(null)}
      />

      {/* Baaki sab devices sign out */}
      <AppAlert
        visible={confirmAll}
        type="warning"
        title="Sign out all other devices?"
        message={`${others.length} other ${others.length === 1 ? "device" : "devices"} will be signed out. You'll stay signed in on this device only.`}
        dismissible={!busy}
        buttons={[
          {
            text: busy ? "Signing out..." : "Sign out all",
            variant: "primary",
            onPress: revokeAll,
          },
          {
            text: "Cancel",
            variant: "secondary",
            onPress: () => !busy && setConfirmAll(false),
          },
        ]}
        onClose={() => !busy && setConfirmAll(false)}
      />
    </Page>
  );
}

const makeStyles = (p: UiPalette) =>
  StyleSheet.create({
    stack: { gap: 24 },
    section: { gap: 8 },
    list: { gap: 12 },
    footerCol: { gap: 10, width: "100%" },

    /* cards */
    card: {
      padding: 14,
      gap: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: p.line,
      backgroundColor: p.card,
    },
    currentCard: {
      padding: 14,
      gap: 12,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: alpha(p.primary, 0.4),
      backgroundColor: alpha(p.primary, 0.06),
    },
    topRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconBox: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: alpha(p.muted, 0.12),
      alignItems: "center",
      justifyContent: "center",
    },
    iconBoxCurrent: { backgroundColor: alpha(p.primary, 0.16) },
    info: { flex: 1, minWidth: 0, gap: 2 },
    name: {
      fontFamily: fonts.semiBold,
      fontSize: 14.5,
      lineHeight: 19,
      color: p.text,
      includeFontPadding: false,
    },
    meta: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 16,
      color: p.muted,
      includeFontPadding: false,
    },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: alpha(p.primary, 0.14),
    },
    badgeText: {
      fontFamily: fonts.semiBold,
      fontSize: 11,
      color: p.primary,
    },

    signOutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 11,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: alpha(DANGER, 0.4),
      backgroundColor: alpha(DANGER, 0.06),
    },
    signOutText: {
      fontFamily: fonts.semiBold,
      fontSize: 13,
      color: DANGER,
    },

    /* empty */
    emptyBox: {
      alignItems: "center",
      gap: 6,
      paddingVertical: 28,
      borderRadius: 18,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: p.line,
    },
    emptyIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: alpha(GREEN, 0.14),
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    emptyTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
      color: p.text,
    },
    empty: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: p.muted,
      textAlign: "center",
    },
  });
