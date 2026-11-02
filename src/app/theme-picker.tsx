import { FlatList, Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { makeUseStyles, useTheme } from "../theme/theme";
import { themeNames, themes } from "../theme/themes";

const useStyles = makeUseStyles((t) => ({
  container: {
    flex: 1,
    backgroundColor: t.colors.background,
    padding: t.spacing.lg,
    paddingTop: t.spacing.xxxl,
  },
  heading: {
    ...t.typography.h2,
    color: t.colors.text,
    marginBottom: t.spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: t.colors.card,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: t.spacing.md,
    marginBottom: t.spacing.sm,
    ...t.shadows.sm,
  },
  rowActive: { borderColor: t.colors.primary, borderWidth: 2 },
  name: {
    ...t.typography.bodyMedium,
    color: t.colors.text,
    flex: 1,
    textTransform: "capitalize",
  },
  swatches: { flexDirection: "row", gap: t.spacing.xs },
  dot: { width: 18, height: 18, borderRadius: t.radius.full },
}));

export default function ThemePicker() {
  const styles = useStyles();
  const { name: current, setTheme, colors } = useTheme();

  const isDark = parseInt(colors.background.slice(1, 3), 16) < 128;

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Text style={styles.heading}>Choose theme</Text>

      <FlatList
        data={themeNames}
        keyExtractor={(n) => n}
        renderItem={({ item }) => {
          const th = themes[item];
          return (
            <Pressable
              onPress={() => setTheme(item)}
              style={[styles.row, current === item && styles.rowActive]}
            >
              <Text style={styles.name}>{item}</Text>
              <View style={styles.swatches}>
                {[th.primary, th.secondary, th.accent, th.background].map(
                  (c, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: c,
                          borderWidth: 1,
                          borderColor: th.border,
                        },
                      ]}
                    />
                  ),
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
