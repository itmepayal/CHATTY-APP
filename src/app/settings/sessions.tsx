import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  ActionSheet,
  Avatar,
  DANGER,
  IconName,
  MUTED,
  SheetAction,
  TEXT,
  colors,
  fonts,
} from "../../components/ui";
import {
  Banner,
  Button,
  Card,
  Divider,
  Page,
  SectionLabel,
  useFlash,
} from "../../components/settings";

type Session = {
  id: string;
  device: string;
  place: string;
  last: string;
  icon: IconName;
  current?: boolean;
};

const INITIAL: Session[] = [
  {
    id: "1",
    device: "Pixel 8 · Chatty Android",
    place: "Ahmedabad, IN",
    last: "Active now",
    icon: "phone-portrait-outline",
    current: true,
  },
  {
    id: "2",
    device: "Chrome on Windows",
    place: "Mumbai, IN",
    last: "2 hours ago",
    icon: "laptop-outline",
  },
  {
    id: "3",
    device: "Safari on iPhone",
    place: "Delhi, IN",
    last: "Yesterday",
    icon: "phone-portrait-outline",
  },
  {
    id: "4",
    device: "Firefox on Linux",
    place: "Pune, IN",
    last: "5 days ago",
    icon: "laptop-outline",
  },
];

export default function Sessions() {
  const [list, setList] = useState(INITIAL);
  const [target, setTarget] = useState<Session | null>(null); // DELETE /auth/sessions/{id}
  const [allSheet, setAllSheet] = useState(false); // POST /auth/sessions/revoke-others
  const [done, flash] = useFlash();

  const others = list.filter((x) => !x.current);

  return (
    <Page
      title="Active sessions"
      subtitle={`${list.length} device${list.length === 1 ? "" : "s"} logged in`}
      footer={
        <Button
          label="Sign out of all other sessions"
          variant="danger"
          icon="log-out-outline"
          disabled={others.length === 0}
          onPress={() => setAllSheet(true)}
        />
      }
    >
      {done && <Banner tone="success" text="Session signed out (demo)." />}
      <SectionLabel>This device</SectionLabel>
      <Card>
        {list
          .filter((x) => x.current)
          .map((x) => (
            <Row key={x.id} s={x} />
          ))}
      </Card>

      <SectionLabel>Other sessions</SectionLabel>
      {others.length === 0 ? (
        <Text style={st.empty}>No other active sessions.</Text>
      ) : (
        <Card>
          {others.map((x, i) => (
            <View key={x.id}>
              <Row s={x} onRevoke={() => setTarget(x)} />
              {i < others.length - 1 && <Divider />}
            </View>
          ))}
        </Card>
      )}

      <ActionSheet
        visible={!!target}
        onClose={() => setTarget(null)}
        title={target?.device ?? ""}
        subtitle={target?.place}
        avatar={
          <Avatar
            icon={target?.icon ?? "phone-portrait-outline"}
            tint={["#FEE2E2", "#B91C1C"]}
            size={42}
          />
        }
      >
        <SheetAction
          icon="log-out"
          label="Sign out this session"
          danger
          onPress={() => {
            setList((l) => l.filter((x) => x.id !== target?.id));
            setTarget(null);
            flash();
          }}
        />
        <SheetAction
          icon="close"
          label="Cancel"
          onPress={() => setTarget(null)}
        />
      </ActionSheet>

      <ActionSheet
        visible={allSheet}
        onClose={() => setAllSheet(false)}
        title="Sign out all other sessions?"
        subtitle="You'll stay logged in on this device"
        avatar={
          <Avatar icon="log-out" tint={["#FEE2E2", "#B91C1C"]} size={42} />
        }
      >
        <SheetAction
          icon="log-out"
          label="Sign out everywhere else"
          danger
          onPress={() => {
            setList((l) => l.filter((x) => x.current));
            setAllSheet(false);
            flash();
          }}
        />
        <SheetAction
          icon="close"
          label="Cancel"
          onPress={() => setAllSheet(false)}
        />
      </ActionSheet>
    </Page>
  );
}

function Row({ s, onRevoke }: { s: Session; onRevoke?: () => void }) {
  return (
    <View style={st.row}>
      <View style={st.icon}>
        <Ionicons name={s.icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.name} numberOfLines={1}>
          {s.device}
        </Text>
        <Text style={st.meta} numberOfLines={1}>
          {s.place} ·{" "}
          {s.current ? (
            <Text style={{ color: "#047857" }}>Active now</Text>
          ) : (
            s.last
          )}
        </Text>
      </View>
      {onRevoke ? (
        <Pressable
          onPress={onRevoke}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Sign out ${s.device}`}
        >
          <Text style={st.revoke}>Revoke</Text>
        </Pressable>
      ) : (
        <Text style={st.badge}>This device</Text>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
    includeFontPadding: false,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: MUTED,
    includeFontPadding: false,
  },
  revoke: { fontFamily: fonts.semiBold, fontSize: 12.5, color: DANGER },
  badge: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#047857",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    paddingVertical: 16,
  },
});
