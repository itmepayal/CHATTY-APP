import { StyleSheet } from "react-native";
import { fonts, radius, space } from "../../components/ui";

export const TRACK_PAD = 4;
export const TAB_H = 38;

export const s = StyleSheet.create({
  shadow: {
    borderBottomLeftRadius: radius.card,
    borderBottomRightRadius: radius.card,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  wrap: {
    paddingBottom: 20,
    borderBottomLeftRadius: radius.card,
    borderBottomRightRadius: radius.card,
    overflow: "hidden",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.screen,
    paddingBottom: 18,
  },
  titleBlock: { flex: 1, minWidth: 0, marginRight: 12 },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    includeFontPadding: false,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  logout: {
    height: 42,
    paddingHorizontal: 13,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth * 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  logoutText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 16,
    includeFontPadding: false,
  },

  search: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: space.screen,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth * 2,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    paddingVertical: 0,
    includeFontPadding: false,
  },

  track: {
    flexDirection: "row",
    marginHorizontal: space.screen,
    marginTop: 14,
    padding: TRACK_PAD,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  pill: {
    position: "absolute",
    top: TRACK_PAD,
    left: TRACK_PAD,
    height: TAB_H,
    borderRadius: radius.pill,
  },
  tab: {
    flex: 1,
    height: TAB_H,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    includeFontPadding: false,
  },
});
