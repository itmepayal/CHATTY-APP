import { StyleSheet, TextStyle, ViewStyle } from "react-native";
import type { Theme } from "../theme/theme";
import { alpha } from "../theme/theme";

export const authBase = (t: Theme) => {
  const c = t.colors;
  const f = t.fonts;

  return {
    flex: { flex: 1 },
    container: { flex: 1 },
    safe: { flex: 1 },

    blobTop: {
      position: "absolute",
      top: -80,
      right: -90,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: alpha(c.white, 0.14),
    },
    blobLeft: {
      position: "absolute",
      top: "14%",
      left: -80,
      width: 160,
      height: 200,
      borderRadius: 100,
      backgroundColor: alpha(c.white, 0.08),
    },

    hero: {
      paddingHorizontal: 24,
      paddingTop: 18,
      paddingBottom: 30,
    },
    logoWrap: {
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "flex-start",
    },
    logoRing: {
      position: "absolute",
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: alpha(c.white, 0.16),
    },
    logoBox: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: alpha(c.white, 0.35),
    },
    title: {
      marginTop: 12,
      fontFamily: f.semiBold,
      fontSize: 27,
      lineHeight: 35,
      color: c.white,
      letterSpacing: -0.3,
      includeFontPadding: false,
    },
    subtitle: {
      marginTop: 4,
      fontFamily: f.regular,
      fontSize: 13.5,
      lineHeight: 20,
      color: alpha(c.white, 0.78),
      includeFontPadding: false,
    },

    panel: {
      flex: 1,
      backgroundColor: c.surface,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      shadowColor: c.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: -6 },
      elevation: 16,
    },
    panelScroll: {
      flex: 1,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
    },
    panelContent: {
      paddingHorizontal: 24,
      paddingTop: 12,
      width: "100%",
      maxWidth: 460,
      alignSelf: "center",
    },
    grabber: {
      alignSelf: "center",
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.hairline,
      marginBottom: 24,
    },

    primaryBtn: {
      height: 56,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      shadowColor: c.primary,
      shadowOpacity: 0.32,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    primaryText: {
      fontFamily: f.semiBold,
      fontSize: 15.5,
      lineHeight: 20,
      color: c.white,
      includeFontPadding: false,
    },

    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 20,
      gap: 12,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
    },
    or: {
      fontFamily: f.regular,
      fontSize: 11.5,
      lineHeight: 16,
      color: c.muted,
      includeFontPadding: false,
    },

    socialBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      height: 54,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      gap: 12,
      shadowColor: c.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    socialText: {
      fontFamily: f.medium,
      fontSize: 14,
      lineHeight: 20,
      color: c.ink,
      includeFontPadding: false,
    },

    footer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 22,
    },
    footerText: {
      fontFamily: f.regular,
      fontSize: 13,
      lineHeight: 18,
      color: c.subtle,
      includeFontPadding: false,
    },
    footerLink: {
      fontFamily: f.semiBold,
      fontSize: 13.5,
      lineHeight: 18,
      color: c.primary,
      includeFontPadding: false,
    },
  } satisfies Record<string, ViewStyle | TextStyle>;
};
