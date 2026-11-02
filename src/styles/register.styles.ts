import { StyleSheet } from "react-native";
import { makeUseStyles } from "../theme/theme";
import { alpha } from "../theme/theme";
import { authBase } from "./auth.base";

const AVATAR = 96;

export const useStyles = makeUseStyles((t) => {
  const c = t.colors;
  const f = t.fonts;

  return StyleSheet.create({
    ...authBase(t),

    avatarSection: {
      alignItems: "center",
      marginTop: -6,
      marginBottom: 22,
    },
    avatarWrap: {
      width: AVATAR,
      height: AVATAR,
      alignSelf: "center",
    },
    avatarCircle: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: AVATAR / 2,
      backgroundColor: alpha(c.primary, 0.1),
      borderWidth: 3,
      borderColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      shadowColor: c.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    avatarCircleFilled: {
      backgroundColor: c.surface,
    },
    avatarImage: {
      width: "100%",
      height: "100%",
    },
    avatarBadge: {
      position: "absolute",
      right: 0,
      bottom: 2,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2.5,
      borderColor: c.surface,
      zIndex: 2,
      elevation: 6,
    },
    avatarLabel: {
      marginTop: 10,
      fontFamily: f.medium,
      fontSize: 13,
      lineHeight: 18,
      color: c.ink,
      includeFontPadding: false,
    },
    avatarHint: {
      marginTop: 2,
      fontFamily: f.regular,
      fontSize: 11.5,
      lineHeight: 16,
      color: c.muted,
      includeFontPadding: false,
    },

    strengthWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: -4,
      marginBottom: 6,
    },
    strengthBars: { flex: 1, flexDirection: "row", gap: 6 },
    strengthBar: { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel: {
      fontFamily: f.semiBold,
      fontSize: 11,
      lineHeight: 16,
      minWidth: 58,
      textAlign: "right",
      includeFontPadding: false,
    },
  });
});
