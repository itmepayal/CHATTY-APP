import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";

const fonts = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semiBold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
};

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Props = TextInputProps & {
  label: string;
  isPassword?: boolean;
  rightLabel?: string;
  onRightLabelPress?: () => void;
  error?: string;
  leftIcon?: IconName;
  valid?: boolean;
};

export default function AuthInput({
  label,
  isPassword,
  rightLabel,
  onRightLabelPress,
  error,
  leftIcon,
  valid,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [hidden, setHidden] = useState(!!isPassword);
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? "#EF4444"
    : focused
      ? colors.primary
      : colors.border;
  const iconColor = error ? "#EF4444" : focused ? colors.primary : colors.muted;

  // Error label ki line me dikhega (layout shift nahi hoga).
  // Agar rightLabel (jaise "Forgot?") hai to error neeche dikhega.
  const errorInline = !!error && !rightLabel;
  const errorBelow = !!error && !!rightLabel;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>

        {errorInline ? (
          <View style={styles.errorInline}>
            <Ionicons name="alert-circle" size={12} color="#EF4444" />
            <Text style={styles.errorText} numberOfLines={1}>
              {error}
            </Text>
          </View>
        ) : rightLabel ? (
          <TouchableOpacity onPress={onRightLabelPress}>
            <Text style={styles.right}>{rightLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View
        style={[
          styles.inputBox,
          { borderColor },
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={iconColor}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          style={styles.input}
          placeholderTextColor="#A9ACC4"
          secureTextEntry={hidden}
          autoCapitalize="none"
          selectionColor={colors.primary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setHidden((h) => !h)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={hidden ? "eye-off-outline" : "eye-outline"}
              size={19}
              color={colors.muted}
            />
          </TouchableOpacity>
        ) : valid ? (
          <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
        ) : null}
      </View>

      {errorBelow ? (
        <View style={styles.errorBelow}>
          <Ionicons name="alert-circle" size={12} color="#EF4444" />
          <Text style={styles.errorText} numberOfLines={1}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8, width: "100%" },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
    minHeight: 16,
  },
  label: { fontFamily: fonts.medium, fontSize: 12, color: colors.text },
  right: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primary },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 12,
    height: 44,
  },
  inputFocused: {
    backgroundColor: "#fff",
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  inputError: { backgroundColor: "#FEF2F2" },
  leftIcon: { marginRight: 10 },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  errorInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
    marginLeft: 8,
  },
  errorBelow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    marginLeft: 2,
  },
  errorText: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#EF4444",
  },
});
