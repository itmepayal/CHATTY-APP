import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SectionList,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Avatar,
  BG,
  EmptyState,
  Field,
  FieldLabel,
  HeaderButton,
  LINE,
  ListRow,
  MUTED,
  PreviewText,
  PrimaryButton,
  RowMeta,
  Screen,
  ScreenTop,
  SearchBar,
  SectionHeader,
  Separator,
  StripItem,
  StripSection,
  Text,
  colors,
  fonts,
  listContentStyle,
  space,
  useReduceMotion,
  useScrolled,
  TEXT,
} from "../components/ui";
import { CONTACTS, groupByLetter } from "../constants/contacts";

type Step = "select" | "details";

export default function NewGroup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const reduceMotion = useReduceMotion();
  const { scrolled, onScroll } = useScrolled();

  const [step, setStep] = useState<Step>("select");
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const q = query.trim().toLowerCase();

  useEffect(() => {
    if (step !== "details") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setStep("select");
      return true;
    });
    return () => sub.remove();
  }, [step]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const selectedContacts = useMemo(
    () => CONTACTS.filter((c) => selected.includes(c.id)),
    [selected],
  );

  const sections = useMemo(
    () =>
      groupByLetter(
        CONTACTS.filter((c) => !q || c.name.toLowerCase().includes(q)),
      ),
    [q],
  );

  const next = () => {
    if (selected.length === 0) {
      Alert.alert("Add members", "Select at least one person for the group.");
      return;
    }
    setQuery("");
    setStep("details");
  };

  const removeMember = (id: string) => {
    const left = selected.filter((x) => x !== id);
    setSelected(left);
    if (left.length === 0) setStep("select");
  };

  const create = () => {
    if (!name.trim()) {
      Alert.alert("Group name required", "Please enter a name for your group.");
      return;
    }
    router.replace(`/chat/local-${Date.now()}` as never);
  };

  if (step === "details") {
    return (
      <Screen>
        <ScreenTop
          title="Group details"
          subtitle={`${selected.length} ${
            selected.length === 1 ? "member" : "members"
          }`}
          scrolled={scrolled}
          actions={
            <HeaderButton
              icon="arrow-back"
              label="Back to members"
              onPress={() => setStep("select")}
            />
          }
        />

        <KeyboardAvoidingView
          style={local.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            onScroll={onScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={local.detailsContent}
          >
            <View style={local.hero}>
              <Avatar icon="people" tint={["#EDE9FE", "#6D28D9"]} size={72} />
              <Text style={local.heroText} numberOfLines={1}>
                {name.trim() || "Your new group"}
              </Text>
            </View>

            <View style={local.nameWrap}>
              <FieldLabel>Group name</FieldLabel>
              <Field
                value={name}
                onChangeText={setName}
                placeholder="e.g. Project Team"
                maxLength={60}
                autoFocus
                returnKeyType="done"
                accessibilityLabel="Group name"
              />
            </View>

            <SectionHeader title="Members" count={selectedContacts.length} />
            {selectedContacts.map((c, i) => (
              <React.Fragment key={c.id}>
                {i > 0 && <Separator />}
                <ListRow
                  avatar={<Avatar name={c.name} tint={c.tint} />}
                  title={c.name}
                  onPress={() => removeMember(c.id)}
                  accessibilityHint="Tap to remove from group"
                  accessibilityLabel={`${c.name}. Remove from group`}
                >
                  <PreviewText>{c.about}</PreviewText>
                  <RowMeta>
                    <Ionicons name="close-circle" size={20} color={MUTED} />
                  </RowMeta>
                </ListRow>
              </React.Fragment>
            ))}
          </ScrollView>

          <View
            style={[local.bottomBar, { paddingBottom: insets.bottom + 12 }]}
          >
            <PrimaryButton
              label="Create group"
              icon="checkmark"
              onPress={create}
            />
          </View>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenTop
        title="New group"
        subtitle={
          selected.length > 0
            ? `${selected.length} selected`
            : "Add members to your group"
        }
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
          placeholder="Search contacts"
          label="Search contacts"
        />
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
          selectedContacts.length > 0 ? (
            <StripSection title={`Selected · ${selectedContacts.length}`}>
              {selectedContacts.map((c) => (
                <StripItem
                  key={c.id}
                  label={c.name.split(" ")[0]}
                  accessibilityLabel={`Remove ${c.name}`}
                  onPress={() => toggle(c.id)}
                  avatar={<Avatar name={c.name} tint={c.tint} size={46} />}
                />
              ))}
            </StripSection>
          ) : undefined
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} />
        )}
        renderItem={({ item, index }) => {
          const on = selected.includes(item.id);
          return (
            <ListRow
              index={index}
              reduceMotion={reduceMotion}
              avatar={
                <Avatar
                  name={item.name}
                  tint={item.tint}
                  online={item.online}
                />
              }
              title={item.name}
              titleStrong={on}
              onPress={() => toggle(item.id)}
              accessibilityHint={on ? "Tap to remove" : "Tap to add"}
              accessibilityLabel={`${item.name}. ${on ? "Selected" : "Not selected"}`}
            >
              <PreviewText accent={item.online}>
                {item.online ? "Online" : item.about}
              </PreviewText>
              <RowMeta>
                <Ionicons
                  name={on ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={on ? colors.primary : MUTED}
                />
              </RowMeta>
            </ListRow>
          );
        }}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title={`No results for “${query.trim()}”`}
            subtitle="Check the spelling or try a different name."
          />
        }
      />

      <View style={[local.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <PrimaryButton
          label={selected.length > 0 ? `Next (${selected.length})` : "Next"}
          icon="arrow-forward"
          onPress={next}
        />
      </View>
    </Screen>
  );
}

const local = StyleSheet.create({
  flex: { flex: 1 },
  detailsContent: { paddingBottom: 24 },
  hero: {
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: space.screen,
  },
  heroText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
    marginTop: 10,
    includeFontPadding: false,
  },
  nameWrap: { paddingHorizontal: space.screen, paddingTop: 20 },
  bottomBar: {
    paddingTop: 12,
    paddingHorizontal: space.screen,
    backgroundColor: BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE,
  },
});
