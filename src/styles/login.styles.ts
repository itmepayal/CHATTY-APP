import { StyleSheet } from "react-native";
import { makeUseStyles } from "../theme/theme";
import { authBase } from "./auth.base";

export const useStyles = makeUseStyles((t) =>
  StyleSheet.create({
    ...authBase(t),
  }),
);
