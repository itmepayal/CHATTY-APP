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
import { colors, fonts, palette } from "../../constants/theme";

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

const ERROR = "#EF4444";
const PLACEHOLDER = "#A9ACC4";

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

  const hasValue = !!rest.value && String(rest.value).length > 0;

  const borderColor = error ? ERROR : focused ? colors.primary : colors.border;
  const iconColor = error ? ERROR : focused ? colors.primary : colors.muted;

  const errorInline = !!error && !rightLabel;
  const errorBelow = !!error && !!rightLabel;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>

        {errorInline ? (
          <View style={styles.errorInline}>
            <Ionicons name="alert-circle" size={12} color={ERROR} />
            <Text style={styles.errorText} numberOfLines={1}>
              {error}
            </Text>
          </View>
        ) : rightLabel ? (
          <TouchableOpacity
            onPress={onRightLabelPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
          >
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
          style={[styles.input, { fontSize: hasValue ? 14 : 12 }]}
          placeholderTextColor={PLACEHOLDER}
          secureTextEntry={hidden}
          autoCapitalize="none"
          selectionColor={colors.primary}
          accessibilityLabel={label}
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
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <Ionicons
              name={hidden ? "eye-off-outline" : "eye-outline"}
              size={19}
              color={colors.muted}
            />
          </TouchableOpacity>
        ) : valid ? (
          <Ionicons name="checkmark-circle" size={18} color={palette.success} />
        ) : null}
      </View>

      {errorBelow ? (
        <View style={styles.errorBelow}>
          <Ionicons name="alert-circle" size={12} color={ERROR} />
          <Text style={styles.errorText} numberOfLines={1}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14, width: "100%" },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
    minHeight: 18,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 18,
    color: palette.ink,
    includeFontPadding: false,
  },
  right: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 18,
    color: colors.primary,
    includeFontPadding: false,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    borderRadius: 14,
    backgroundColor: palette.surfaceMuted,
    paddingHorizontal: 14,
    height: 52,
  },
  inputFocused: {
    backgroundColor: palette.white,
    shadowColor: colors.primary,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  inputError: { backgroundColor: "#FEF2F2" },
  leftIcon: { marginRight: 10 },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    color: palette.ink,
    paddingVertical: 0,
    includeFontPadding: false,
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
    marginTop: 5,
    marginLeft: 2,
  },
  errorText: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: ERROR,
    includeFontPadding: false,
  },
});
