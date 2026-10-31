import React, { useState } from "react";
import {
  Banner,
  Button,
  Card,
  OptionRow,
  Page,
  SectionLabel,
  Segmented,
  ToggleRow,
  useFlash,
} from "../../components/settings";

type Dl = "wifi" | "mobile" | "never";
type Timer = "off" | "24h" | "7d" | "90d";

const TIMERS: [Timer, string][] = [
  ["off", "Off"],
  ["24h", "24 hours"],
  ["7d", "7 days"],
  ["90d", "90 days"],
];

export default function ChatSettings() {
  const [enterSend, setEnterSend] = useState(false);
  const [previews, setPreviews] = useState(true);
  const [archived, setArchived] = useState(true);
  const [dl, setDl] = useState<Dl>("wifi");
  const [timer, setTimer] = useState<Timer>("off");
  const [done, flash] = useFlash();

  // UI only: GET /users/chat-settings to load, PATCH /users/chat-settings to save
  return (
    <Page
      title="Chat settings"
      subtitle="Defaults for all your chats"
      footer={<Button label="Save changes" icon="checkmark" onPress={flash} />}
    >
      {done && <Banner tone="success" text="Chat settings saved." />}

      <SectionLabel>Messages</SectionLabel>
      <Card>
        <ToggleRow
          icon="return-down-back-outline"
          tint={["#D1FAE5", "#047857"]}
          label="Enter key sends message"
          sub="Turn off to use Enter for a new line"
          value={enterSend}
          onValueChange={setEnterSend}
        />
        <ToggleRow
          icon="link-outline"
          tint={["#DBEAFE", "#1D4ED8"]}
          label="Link previews"
          sub="Show a preview for links you send"
          value={previews}
          onValueChange={setPreviews}
        />
        <ToggleRow
          icon="archive-outline"
          tint={["#FEF3C7", "#B45309"]}
          label="Keep archived chats archived"
          sub="New messages won't move them back to your inbox"
          value={archived}
          onValueChange={setArchived}
          last
        />
      </Card>

      <SectionLabel>Media auto-download</SectionLabel>
      <Card>
        <Segmented<Dl>
          value={dl}
          onChange={setDl}
          options={[
            { value: "wifi", label: "Wi-Fi only" },
            { value: "mobile", label: "Wi-Fi + data" },
            { value: "never", label: "Never" },
          ]}
        />
      </Card>

      <SectionLabel>Disappearing messages</SectionLabel>
      <Card>
        {TIMERS.map(([v, l], i) => (
          <OptionRow
            key={v}
            label={l}
            selected={timer === v}
            onPress={() => setTimer(v)}
            last={i === TIMERS.length - 1}
          />
        ))}
      </Card>
    </Page>
  );
}
