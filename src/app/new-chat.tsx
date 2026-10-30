import React, { useCallback, useMemo, useState } from "react";
import { SectionList, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Avatar,
  EmptyState,
  HeaderButton,
  IconName,
  ListRow,
  PreviewText,
  Screen,
  ScreenTop,
  SearchBar,
  SectionHeader,
  Separator,
  TabPills,
  Tint,
  listContentStyle,
  useReduceMotion,
  useScrolled,
} from "../components/ui";
import { CONTACTS, groupByLetter } from "../constants/contacts";

const TABS = ["All", "Online"] as const;
type Tab = (typeof TABS)[number];

const ACTIONS: {
  id: string;
  icon: IconName;
  title: string;
  sub: string;
  route: string;
  tint: Tint;
}[] = [
  {
    id: "group",
    icon: "people",
    title: "New group",
    sub: "Chat with several people at once",
    route: "/new-group",
    tint: ["#EDE9FE", "#6D28D9"],
  },
  {
    id: "contact",
    icon: "person-add",
    title: "New contact",
    sub: "Add someone by name or number",
    route: "/new-contact",
    tint: ["#D1FAE5", "#047857"],
  },
];

export default function NewChat() {
  const router = useRouter();
  const go = useCallback(
    (path: string) => router.push(path as never),
    [router],
  );

  const reduceMotion = useReduceMotion();
  const { scrolled, onScroll } = useScrolled();

  const [tab, setTab] = useState<Tab>("All");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const onlineCount = CONTACTS.filter((c) => c.online).length;

  const sections = useMemo(
    () =>
      groupByLetter(
        CONTACTS.filter((c) => {
          if (tab === "Online" && !c.online) return false;
          if (!q) return true;
          return c.name.toLowerCase().includes(q);
        }),
      ),
    [tab, q],
  );

  return (
    <Screen>
      <ScreenTop
        title="New chat"
        subtitle={`${CONTACTS.length} contacts · ${onlineCount} online`}
        scrolled={scrolled}
        actions={
          <HeaderButton
            icon="close"
            label="Close"
            onPress={() => router.back()}
          />
        }
      >
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search name or number"
          label="Search contacts"
        />
        <TabPills tabs={TABS} active={tab} onChange={setTab} />
      </ScreenTop>

      <SectionList
        sections={sections}
        keyExtractor={(c) => c.id}
        stickySectionHeadersEnabled={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listContentStyle}
        ListHeaderComponent={
          !q && tab === "All" ? (
            <View>
              {ACTIONS.map((a, i) => (
                <React.Fragment key={a.id}>
                  <ListRow
                    index={i}
                    reduceMotion={reduceMotion}
                    avatar={<Avatar icon={a.icon} tint={a.tint} />}
                    title={a.title}
                    titleStrong
                    onPress={() => go(a.route)}
                    accessibilityLabel={`${a.title}. ${a.sub}`}
                  >
                    <PreviewText>{a.sub}</PreviewText>
                  </ListRow>
                  <Separator />
                </React.Fragment>
              ))}
            </View>
          ) : undefined
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} />
        )}
        renderItem={({ item, index }) => (
          <ListRow
            index={index + ACTIONS.length}
            reduceMotion={reduceMotion}
            avatar={
              <Avatar name={item.name} tint={item.tint} online={item.online} />
            }
            title={item.name}
            onPress={() => go(`/chat/${item.id}`)}
            accessibilityHint="Opens a conversation"
            accessibilityLabel={`${item.name}. ${
              item.online ? "Online" : item.about
            }`}
          >
            <PreviewText accent={item.online}>
              {item.online ? "Online" : item.about}
            </PreviewText>
          </ListRow>
        )}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <EmptyState
            icon={q ? "search" : "people-outline"}
            title={q ? `No results for “${query.trim()}”` : "No contacts here"}
            subtitle={
              q
                ? "Check the spelling or try a different name."
                : "Contacts who are online will show up here."
            }
          />
        }
      />
    </Screen>
  );
}
