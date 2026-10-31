import React, { useState } from "react";
import {
  Banner,
  Button,
  Card,
  OptionRow,
  Page,
  SectionLabel,
  ToggleRow,
  useFlash,
} from "../../components/settings";

type Vis = "everyone" | "contacts" | "nobody";
const VIS: { v: Vis; label: string }[] = [
  { v: "everyone", label: "Everyone" },
  { v: "contacts", label: "My contacts" },
  { v: "nobody", label: "Nobody" },
];

function Group({
  title,
  value,
  onChange,
}: {
  title: string;
  value: Vis;
  onChange: (v: Vis) => void;
}) {
  return (
    <>
      <SectionLabel>{title}</SectionLabel>
      <Card>
        {VIS.map((o, i) => (
          <OptionRow
            key={o.v}
            label={o.label}
            selected={value === o.v}
            onPress={() => onChange(o.v)}
            last={i === VIS.length - 1}
          />
        ))}
      </Card>
    </>
  );
}

export default function Privacy() {
  const [lastSeen, setLastSeen] = useState<Vis>("contacts");
  const [photo, setPhoto] = useState<Vis>("everyone");
  const [about, setAbout] = useState<Vis>("contacts");
  const [groups, setGroups] = useState<Vis>("contacts");
  const [receipts, setReceipts] = useState(true);
  const [online, setOnline] = useState(true);
  const [typing, setTyping] = useState(true);
  const [done, flash] = useFlash();

  // UI only: GET /users/privacy to load, PATCH /users/privacy to save
  return (
    <Page
      title="Privacy"
      subtitle="Control who can see your information"
      footer={<Button label="Save changes" icon="checkmark" onPress={flash} />}
    >
      {done && <Banner tone="success" text="Privacy settings saved." />}

      <Group title="Last seen" value={lastSeen} onChange={setLastSeen} />
      <Group title="Profile photo" value={photo} onChange={setPhoto} />
      <Group title="About" value={about} onChange={setAbout} />
      <Group
        title="Who can add me to groups"
        value={groups}
        onChange={setGroups}
      />

      <SectionLabel>Activity</SectionLabel>
      <Card>
        <ToggleRow
          icon="checkmark-done-outline"
          tint={["#DBEAFE", "#1D4ED8"]}
          label="Read receipts"
          sub="If off, you won't see others' receipts either"
          value={receipts}
          onValueChange={setReceipts}
        />
        <ToggleRow
          icon="radio-button-on-outline"
          tint={["#D1FAE5", "#047857"]}
          label="Show online status"
          sub="Let others see when you're active"
          value={online}
          onValueChange={setOnline}
        />
        <ToggleRow
          icon="ellipsis-horizontal-outline"
          tint={["#FEF3C7", "#B45309"]}
          label="Typing indicator"
          sub="Let others see when you're typing"
          value={typing}
          onValueChange={setTyping}
          last
        />
      </Card>
    </Page>
  );
}
