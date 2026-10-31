import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MUTED, SURFACE, TEXT, BG, fonts } from "../../components/ui";
import {
  Banner,
  Button,
  Card,
  Page,
  SectionLabel,
  Segmented,
  ToggleRow,
  useFlash,
} from "../../components/settings";

type Theme = "system" | "light" | "dark";
type Size = "small" | "default" | "large";
type Bubble = "rounded" | "classic";

const ACCENTS = [
  "#4F46E5",
  "#7C3AED",
  "#DB2777",
  "#EA580C",
  "#059669",
  "#0891B2",
];
const SCALE: Record<Size, number> = { small: 12.5, default: 14, large: 16.5 };

export default function Appearance() {
  const [theme, setTheme] = useState<Theme>("light");
  const [size, setSize] = useState<Size>("default");
  const [bubble, setBubble] = useState<Bubble>("rounded");
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [compact, setCompact] = useState(false);
  const [done, flash] = useFlash();

  const dark = theme === "dark";
  const fs = SCALE[size];
  const r = bubble === "rounded" ? 18 : 6;

  // UI only: GET /users/appearance to load, PATCH /users/appearance to save
  return (
    <Page
      title="Appearance"
      subtitle="Theme, text and chat bubbles"
      footer={<Button label="Save appearance" onPress={flash} />}
    >
      {done && <Banner tone="success" text="Appearance saved (demo)." />}

      <SectionLabel>Preview</SectionLabel>
      <View
        style={[
          st.preview,
          { backgroundColor: dark ? "#14131F" : "#fff", gap: compact ? 4 : 10 },
        ]}
      >
        <View
          style={[
            st.bubble,
            {
              alignSelf: "flex-start",
              backgroundColor: dark ? "#26243A" : BG,
              borderRadius: r,
            },
          ]}
        >
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: fs,
              color: dark ? "#F3F3FA" : TEXT,
            }}
          >
            Hey! Kal milte hain? 👋
          </Text>
        </View>
        <View
          style={[
            st.bubble,
            { alignSelf: "flex-end", backgroundColor: accent, borderRadius: r },
          ]}
        >
          <Text
            style={{ fontFamily: fonts.regular, fontSize: fs, color: "#fff" }}
          >
            Done, 5 baje pakka!
          </Text>
        </View>
      </View>

      <SectionLabel>Theme</SectionLabel>
      <Card>
        <Segmented<Theme>
          value={theme}
          onChange={setTheme}
          options={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
      </Card>

      <SectionLabel>Font size</SectionLabel>
      <Card>
        <Segmented<Size>
          value={size}
          onChange={setSize}
          options={[
            { value: "small", label: "Small" },
            { value: "default", label: "Default" },
            { value: "large", label: "Large" },
          ]}
        />
      </Card>

      <SectionLabel>Bubble style</SectionLabel>
      <Card>
        <Segmented<Bubble>
          value={bubble}
          onChange={setBubble}
          options={[
            { value: "rounded", label: "Rounded" },
            { value: "classic", label: "Classic" },
          ]}
        />
      </Card>

      <SectionLabel>Accent colour</SectionLabel>
      <View style={st.swatches}>
        {ACCENTS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setAccent(c)}
            accessibilityRole="button"
            accessibilityLabel={`Accent ${c}`}
            accessibilityState={{ selected: accent === c }}
            style={[
              st.swatch,
              { backgroundColor: c },
              accent === c && st.swatchOn,
            ]}
          />
        ))}
      </View>

      <Card>
        <ToggleRow
          label="Compact spacing"
          sub="Tighter gaps between messages"
          value={compact}
          onValueChange={setCompact}
          last
        />
      </Card>
    </Page>
  );
}

const st = StyleSheet.create({
  preview: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8E8F0",
  },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, maxWidth: "80%" },
  swatches: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  swatch: { width: 40, height: 40, borderRadius: 20 },
  swatchOn: {
    borderWidth: 3,
    borderColor: SURFACE,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ scale: 1.1 }],
  },
});
void MUTED;
