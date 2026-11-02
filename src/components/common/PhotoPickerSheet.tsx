import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { alpha, makeUseStyles, useTheme } from "../../theme/theme";

type Props = {
  visible: boolean;
  hasPhoto: boolean;
  onClose: () => void;
  onGallery: () => void;
  onCamera: () => void;
  onRemove: () => void;
};

const useStyles = makeUseStyles((t) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: t.colors.card,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingHorizontal: 16,
      paddingTop: 10,
      ...t.shadows.lg,
    },
    grabber: {
      alignSelf: "center",
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.colors.border,
      marginBottom: 12,
    },
    title: {
      fontFamily: t.fonts.semiBold,
      fontSize: 15,
      lineHeight: 21,
      color: t.colors.ink,
      textAlign: "center",
      includeFontPadding: false,
    },
    subtitle: {
      fontFamily: t.fonts.regular,
      fontSize: 12,
      lineHeight: 17,
      color: t.colors.muted,
      textAlign: "center",
      marginTop: 2,
      marginBottom: 12,
      includeFontPadding: false,
    },
    list: { gap: 2 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 9,
      paddingHorizontal: 8,
      borderRadius: 14,
    },
    rowPressed: { backgroundColor: t.colors.input },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    rowTextWrap: { flex: 1 },
    rowLabel: {
      fontFamily: t.fonts.medium,
      fontSize: 13,
      lineHeight: 18,
      color: t.colors.ink,
      includeFontPadding: false,
    },
    rowHint: {
      fontFamily: t.fonts.regular,
      fontSize: 11,
      lineHeight: 15,
      color: t.colors.muted,
      includeFontPadding: false,
    },
    cancel: {
      height: 46,
      borderRadius: 14,
      backgroundColor: t.colors.input,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },
    cancelText: {
      fontFamily: t.fonts.semiBold,
      fontSize: 13,
      color: t.colors.ink,
      includeFontPadding: false,
    },
  }),
);

type RowProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  hint?: string;
  tint: string;
  onPress: () => void;
  danger?: boolean;
};

function Row({ icon, label, hint, tint, onPress, danger }: RowProps) {
  const { colors } = useTheme();
  const s = useStyles();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[s.rowIcon, { backgroundColor: alpha(tint, 0.15) }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <View style={s.rowTextWrap}>
        <Text style={[s.rowLabel, danger && { color: colors.error }]}>
          {label}
        </Text>
        {!!hint && <Text style={s.rowHint}>{hint}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );
}

export default function PhotoPickerSheet({
  visible,
  hasPhoto,
  onClose,
  onGallery,
  onCamera,
  onRemove,
}: Props) {
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slide.setValue(0);
      Animated.timing(slide, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slide]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[
            s.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 12) + 6,
              transform: [
                {
                  translateY: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [320, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={s.grabber} />

          <Text style={s.title}>Profile photo</Text>
          <Text style={s.subtitle}>Apni profile photo select karo</Text>

          <View style={s.list}>
            <Row
              icon="images"
              label="Choose from gallery"
              hint="Phone ki photos me se chuno"
              tint={colors.primary}
              onPress={onGallery}
            />
            <Row
              icon="camera"
              label="Take a photo"
              hint="Camera se abhi photo click karo"
              tint={colors.info}
              onPress={onCamera}
            />
            {hasPhoto && (
              <Row
                icon="trash"
                label="Remove photo"
                tint={colors.error}
                danger
                onPress={onRemove}
              />
            )}
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [s.cancel, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={s.cancelText}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
