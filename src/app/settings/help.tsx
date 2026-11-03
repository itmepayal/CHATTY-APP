import React, { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, fonts, usePalette } from "../../components/ui";
import {
  ActionButton,
  Hero,
  Page,
  SectionTitle,
} from "../../components/settings/settings";
import { alpha, makeUseStyles } from "../../theme/theme";

/* ───────────────────────── Static data ───────────────────────── */

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type ContactItem = {
  id: string;
  label: string;
  sub: string;
  icon: IconName;
  tint: [string, string];
  url: string;
};

const SUPPORT_EMAIL = "support@chatty.app";

const CONTACTS: ContactItem[] = [
  {
    id: "email",
    label: "Email us",
    sub: SUPPORT_EMAIL,
    icon: "mail-outline",
    tint: ["#DBEAFE", "#1D4ED8"],
    url: `mailto:${SUPPORT_EMAIL}?subject=Chatty%20Support`,
  },
  {
    id: "whatsapp",
    label: "Chat with support",
    sub: "Usually replies within a few hours",
    icon: "chatbubble-ellipses-outline",
    tint: ["#D1FAE5", "#047857"],
    url: "https://wa.me/910000000000",
  },
  {
    id: "web",
    label: "Help center",
    sub: "Guides and tutorials",
    icon: "globe-outline",
    tint: ["#EDE9FE", "#6D28D9"],
    url: "https://chatty.app/help",
  },
];

type Faq = { id: string; q: string; a: string };

const FAQS: Faq[] = [
  {
    id: "reset",
    q: "How do I reset my password?",
    a: "Go to Settings → Account & Security → Password. If you can't sign in, tap “Forgot password” on the login screen and we'll email you a reset link.",
  },
  {
    id: "2fa",
    q: "How do I turn on two-factor?",
    a: "Open Settings → Account & Security → Two-factor and scan the QR code with any authenticator app. Enter the 6-digit code to finish.",
  },
  {
    id: "block",
    q: "How do I block someone?",
    a: "Open the chat, tap the contact name at the top and choose Block. You can manage blocked people from Settings → Privacy.",
  },
  {
    id: "disappearing",
    q: "What are disappearing messages?",
    a: "Messages that delete themselves after the time you choose. Turn them on from the chat menu or Settings → Chat settings.",
  },
  {
    id: "notif",
    q: "I'm not getting notifications",
    a: "Check that Push notifications is on in Settings, and that Chatty is allowed to send notifications in your phone's system settings.",
  },
  {
    id: "delete",
    q: "How do I delete my account?",
    a: "Go to Settings → Account & Security and scroll to the bottom. Deleting your account removes your chats and can't be undone.",
  },
];

/* ───────────────────────── Styles ───────────────────────── */

const ICON_BOX = 38;

const useStyles = makeUseStyles((t) => ({
  stack: { gap: 32 },
  section: { gap: 4 },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: t.colors.hairline,
    backgroundColor: t.colors.card,
    overflow: "hidden",
    marginTop: 8,
  },

  /* Contact rows */
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  rowPressed: { backgroundColor: alpha(t.colors.primary, 0.05) },
  rowDivider: {
    position: "absolute",
    left: 14 + ICON_BOX + 12,
    right: 14,
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
  },
  rowBody: { flex: 1, minWidth: 0, marginLeft: 12 },
  rowTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 19,
    color: t.colors.ink,
    includeFontPadding: false,
  },
  rowSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.colors.muted,
    includeFontPadding: false,
  },

  /* FAQ */
  faqHead: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  faqQ: {
    flex: 1,
    marginRight: 10,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 19,
    color: t.colors.ink,
    includeFontPadding: false,
  },
  faqBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  faqA: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: t.colors.muted,
  },
  faqDivider: {
    height: 1,
    backgroundColor: t.colors.hairline,
    marginHorizontal: 14,
  },

  /* Footer + hint */
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: t.colors.muted,
    textAlign: "center",
    marginTop: 4,
  },
}));

/* ───────────────────────── Pieces ───────────────────────── */

function ContactRow({ item, last }: { item: ContactItem; last: boolean }) {
  const st = useStyles();
  const p = usePalette();

  return (
    <Pressable
      onPress={() => Linking.openURL(item.url).catch(() => {})}
      accessibilityRole="button"
      accessibilityLabel={`${item.label}. ${item.sub}`}
      style={({ pressed }) => [st.row, pressed && st.rowPressed]}
    >
      <View style={[st.iconBox, { backgroundColor: item.tint[0] }]}>
        <Ionicons name={item.icon} size={18} color={item.tint[1]} />
      </View>
      <View style={st.rowBody}>
        <Text style={st.rowTitle} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={st.rowSub} numberOfLines={1}>
          {item.sub}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={p.muted} />
      {!last && <View style={st.rowDivider} />}
    </Pressable>
  );
}

function FaqRow({
  item,
  open,
  last,
  onToggle,
}: {
  item: Faq;
  open: boolean;
  last: boolean;
  onToggle: (id: string) => void;
}) {
  const st = useStyles();
  const p = usePalette();

  return (
    <View>
      <Pressable
        onPress={() => onToggle(item.id)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={item.q}
        style={({ pressed }) => [st.faqHead, pressed && st.rowPressed]}
      >
        <Text style={st.faqQ}>{item.q}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={p.muted}
        />
      </Pressable>
      {open && (
        <View style={st.faqBody}>
          <Text style={st.faqA}>{item.a}</Text>
        </View>
      )}
      {!last && <View style={st.faqDivider} />}
    </View>
  );
}

/* ───────────────────────── Screen ───────────────────────── */

export default function HelpSupport() {
  const router = useRouter();
  const st = useStyles();

  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  const reportProblem = () =>
    Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=Problem%20report%20-%20Chatty`,
    ).catch(() => {});

  return (
    <Page
      icon="help-circle-outline"
      title="Help & support"
      subtitle="FAQ, contact us, report a problem"
      footer={
        <View style={st.footerRow}>
          <ActionButton
            label="Back"
            variant="ghost"
            flex={1}
            onPress={() => router.back()}
          />
          <ActionButton
            label="Report a problem"
            variant="primary"
            icon="bug-outline"
            flex={1.4}
            onPress={reportProblem}
          />
        </View>
      }
    >
      <View style={st.stack}>
        <Hero
          icon="help-buoy"
          title="How can we help?"
          text="Find quick answers below, or reach out to us and we'll get back to you as soon as we can."
        />

        <View style={st.section}>
          <SectionTitle title="Contact us" icon="mail-outline" />
          <View style={st.card}>
            {CONTACTS.map((c, i) => (
              <ContactRow
                key={c.id}
                item={c}
                last={i === CONTACTS.length - 1}
              />
            ))}
          </View>
        </View>

        <View style={st.section}>
          <SectionTitle
            title="Frequently asked questions"
            icon="chatbubbles-outline"
          />
          <View style={st.card}>
            {FAQS.map((f, i) => (
              <FaqRow
                key={f.id}
                item={f}
                open={openId === f.id}
                last={i === FAQS.length - 1}
                onToggle={toggle}
              />
            ))}
          </View>
        </View>

        <View style={st.section}>
          <Text style={st.hint}>Chatty v1.0.0</Text>
          <Text style={st.hint}>
            Baat karo, bina ruke. We usually reply within 24 hours.
          </Text>
        </View>
      </View>
    </Page>
  );
}
