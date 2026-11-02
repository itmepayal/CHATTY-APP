import React, { forwardRef, memo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { alpha, makeUseStyles, useTheme } from "../../theme/theme";

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

export type AuthInputRef = React.ComponentRef<typeof TextInput>;

const AuthInput = forwardRef<AuthInputRef, Props>(function AuthInput(
  {
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
  },
  ref,
) {
  const { colors } = useTheme();
  const styles = useStyles();

  const [hidden, setHidden] = useState(!!isPassword);
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
      ? colors.primary
      : colors.border;
  const iconColor = error
    ? colors.error
    : focused
      ? colors.primary
      : colors.muted;

  const errorInline = !!error && !rightLabel;
  const errorBelow = !!error && !!rightLabel;

  // Right slot ki width fixed, taaki checkmark aane/jaane se layout na hile.
  const showRightSlot = !!isPassword || valid !== undefined;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>

        {errorInline ? (
          <View style={styles.errorInline}>
            <Ionicons name="alert-circle" size={11} color={colors.error} />
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
            size={17}
            color={iconColor}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={colors.mutedText}
          secureTextEntry={hidden}
          autoCapitalize="none"
          selectionColor={colors.primary}
          accessibilityLabel={label}
          underlineColorAndroid="transparent"
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

        {showRightSlot ? (
          <View style={styles.rightSlot}>
            {isPassword ? (
              <TouchableOpacity
                onPress={() => setHidden((h) => !h)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={hidden ? "Show password" : "Hide password"}
              >
                <Ionicons
                  name={hidden ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={colors.muted}
                />
              </TouchableOpacity>
            ) : (
              <Ionicons
                name="checkmark-circle"
                size={17}
                color={colors.success}
                style={{ opacity: valid ? 1 : 0 }}
              />
            )}
          </View>
        ) : null}
      </View>

      {errorBelow ? (
        <View style={styles.errorBelow}>
          <Ionicons name="alert-circle" size={11} color={colors.error} />
          <Text style={styles.errorText} numberOfLines={1}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

export default memo(AuthInput);

const useStyles = makeUseStyles((t) => {
  const c = t.colors;
  const f = t.fonts;

  return StyleSheet.create({
    wrap: { marginBottom: 12, width: "100%" },
    labelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
      minHeight: 16,
    },
    label: {
      fontFamily: f.medium,
      fontSize: 12,
      lineHeight: 16,
      color: c.ink,
      includeFontPadding: false,
    },
    right: {
      fontFamily: f.semiBold,
      fontSize: 11.5,
      lineHeight: 16,
      color: c.primary,
      includeFontPadding: false,
    },
    inputBox: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.2,
      borderRadius: 12,
      backgroundColor: c.surfaceMuted,
      paddingHorizontal: 13,
      height: 48,
    },
    inputFocused: {
      backgroundColor: c.surface,
      ...Platform.select({
        ios: {
          shadowColor: c.primary,
          shadowOpacity: 0.14,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
        },
        default: {},
      }),
    },
    inputError: { backgroundColor: alpha(c.error, 0.08) },
    leftIcon: { marginRight: 9 },
    input: {
      flex: 1,
      minWidth: 0,
      fontFamily: f.regular,
      fontSize: 13,
      color: c.ink,
      paddingVertical: 0,
      includeFontPadding: false,
    },
    rightSlot: {
      width: 22,
      alignItems: "flex-end",
      justifyContent: "center",
    },
    errorInline: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      flexShrink: 1,
      marginLeft: 8,
    },
    errorBelow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      marginTop: 4,
      marginLeft: 2,
    },
    errorText: {
      flexShrink: 1,
      fontFamily: f.regular,
      fontSize: 10.5,
      color: c.error,
      includeFontPadding: false,
    },
  });
});
