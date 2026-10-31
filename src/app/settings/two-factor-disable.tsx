import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Banner, Button, Field, Page } from "../../components/settings";

export default function TwoFactorDisable() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [tried, setTried] = useState(false);

  const submit = () => {
    setTried(true);
    if (!pw || code.trim().length < 6) return;
    // UI only: POST /auth/2fa/disable would go here
    router.navigate({
      pathname: "/security",
      params: { twofa: "off" },
    } as never);
  };

  return (
    <Page
      title="Turn off two-factor"
      subtitle="Your account will be less secure"
      footer={
        <Button
          label="Turn off two-factor"
          variant="danger"
          icon="shield-outline"
          onPress={submit}
        />
      }
    >
      <Banner
        tone="danger"
        text="Without two-factor, anyone who knows your password can sign in to your account."
      />
      <Field
        label="Password"
        secure
        value={pw}
        onChangeText={setPw}
        autoCapitalize="none"
        placeholder="Enter your password"
        error={tried && !pw ? "Enter your password" : undefined}
      />
      <Field
        label="Authenticator or recovery code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="none"
        placeholder="123456"
        hint="Use the 6-digit code from your app, or a recovery code."
        error={
          tried && code.trim().length < 6 ? "Enter a valid code" : undefined
        }
      />
    </Page>
  );
}
