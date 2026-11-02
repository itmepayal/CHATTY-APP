import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { alpha, makeUseStyles, useTheme } from "../../theme/theme";

export type AlertType = "success" | "error" | "warning" | "info";
export type AlertButton = {
  text: string;
  onPress?: () => void;
  variant?: "primary" | "secondary";
};

type Props = {
  visible: boolean;
  type?: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  dismissible?: boolean;
  onClose: () => void;
};

const ICONS: Record<AlertType, React.ComponentProps<typeof Ionicons>["name"]> =
  {
    success: "checkmark",
    error: "close",
    warning: "alert",
    info: "information",
  };

const useStyles = makeUseStyles((t) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    card: {
      width: "100%",
      maxWidth: 320,
      backgroundColor: t.colors.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: t.colors.hairline,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 18,
      alignItems: "center",
      ...t.shadows.lg,
    },
    iconRing: {
      width: 68,
      height: 68,
      borderRadius: 34,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    iconWrap: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontFamily: t.fonts.semiBold,
      fontSize: 16,
      lineHeight: 22,
      color: t.colors.ink,
      textAlign: "center",
      includeFontPadding: false,
    },
    message: {
      fontFamily: t.fonts.regular,
      fontSize: 12.5,
      lineHeight: 18,
      color: t.colors.muted,
      textAlign: "center",
      marginTop: 6,
      includeFontPadding: false,
    },
    btnRow: { flexDirection: "row", gap: 10, marginTop: 20, width: "100%" },
    btnWrap: { flex: 1 },
    btn: {
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    btnSecondary: { backgroundColor: t.colors.input },
    btnTextPrimary: {
      fontFamily: t.fonts.semiBold,
      fontSize: 13,
      color: t.colors.white,
      includeFontPadding: false,
    },
    btnTextSecondary: {
      fontFamily: t.fonts.semiBold,
      fontSize: 13,
      color: t.colors.ink,
      includeFontPadding: false,
    },
  }),
);

export default function AppAlert({
  visible,
  type = "info",
  title,
  message,
  buttons,
  dismissible = true,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const s = useStyles();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
    }
  }, [visible, anim]);

  const tone = colors[type];
  const list: AlertButton[] =
    buttons && buttons.length > 0
      ? buttons
      : [{ text: "OK", variant: "primary" }];

  const handlePress = (b: AlertButton) => {
    onClose();
    b.onPress?.();
  };
  const handleDismiss = () => {
    if (dismissible) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={s.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        <Animated.View
          style={[
            s.card,
            {
              opacity: anim,
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[s.iconRing, { backgroundColor: alpha(tone, 0.1) }]}>
            <View style={[s.iconWrap, { backgroundColor: alpha(tone, 0.2) }]}>
              <Ionicons name={ICONS[type]} size={26} color={tone} />
            </View>
          </View>

          <Text style={s.title}>{title}</Text>
          {!!message && <Text style={s.message}>{message}</Text>}

          <View style={s.btnRow}>
            {list.map((b, i) => {
              const primary = (b.variant ?? "primary") === "primary";
              return (
                <Pressable
                  key={`${b.text}-${i}`}
                  onPress={() => handlePress(b)}
                  style={({ pressed }) => [
                    s.btnWrap,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={b.text}
                >
                  {primary ? (
                    <LinearGradient
                      colors={[colors.primary, colors.gradientEnd]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={s.btn}
                    >
                      <Text style={s.btnTextPrimary}>{b.text}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[s.btn, s.btnSecondary]}>
                      <Text style={s.btnTextSecondary}>{b.text}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
