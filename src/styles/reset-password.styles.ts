import { StyleSheet } from "react-native";
import { makeUseStyles } from "../theme/theme";
import { authBase } from "./auth.base";

export const useStyles = makeUseStyles((t) => {
  const c = t.colors;
  const f = t.fonts;
  const base = authBase(t);

  return StyleSheet.create({
    ...base,

    footer: {
      ...base.footer,
      minHeight: 22,
    },
    footerLinkDisabled: {
      color: c.muted,
    },

    emailChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.hairline,
    },
    emailChipIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.tint,
      alignItems: "center",
      justifyContent: "center",
    },
    emailChipBody: { flex: 1, minWidth: 0 },
    emailChipLabel: {
      fontFamily: f.regular,
      fontSize: 10.5,
      lineHeight: 14,
      color: c.subtle,
      includeFontPadding: false,
    },
    emailChipText: {
      fontFamily: f.semiBold,
      fontSize: 13.5,
      lineHeight: 19,
      color: c.ink,
      includeFontPadding: false,
    },
    hint: {
      marginTop: 14,
      marginBottom: 22,
      fontFamily: f.regular,
      fontSize: 12,
      lineHeight: 18,
      color: c.subtle,
      textAlign: "center",
      paddingHorizontal: 8,
      includeFontPadding: false,
    },
  });
});
