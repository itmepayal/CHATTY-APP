import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../constants/theme";

// Font names must match the keys loaded in useFonts() inside _layout.tsx
const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

export default function GetStarted() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* soft background shapes */}
      <View style={styles.blobTop} />
      <View style={styles.blobLeft} />

      <SafeAreaView style={styles.safe}>
        {/* logo + title */}
        <View style={styles.top}>
          <View style={styles.logoBox}>
            <Ionicons
              name="chatbubble-ellipses"
              size={42}
              color={colors.primary}
            />
          </View>
          <Text style={styles.title}>Chatty</Text>
          <Text style={styles.tagline}>Connect · Chat · Share</Text>
        </View>

        {/* illustration */}
        <View style={styles.illustrationWrap}>
          <Image
            source={require("../../assets/images/get-started-illustration.png")}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* actions */}
        <View style={styles.bottom}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/auth/register")}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <Text style={styles.small}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text style={styles.link}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 24, justifyContent: "space-between" },

  blobTop: {
    position: "absolute",
    top: -70,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(168,140,255,0.22)",
  },
  blobLeft: {
    position: "absolute",
    top: "38%",
    left: -70,
    width: 150,
    height: 190,
    borderRadius: 90,
    backgroundColor: "rgba(168,140,255,0.16)",
  },

  top: { alignItems: "center", marginTop: 36 },
  logoBox: {
    width: 78,
    height: 78,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B0733",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  // NOTE: with custom fonts, use fontFamily instead of fontWeight
  title: {
    fontFamily: fonts.bold,
    fontSize: 44,
    color: "#fff",
    marginTop: 16,
    letterSpacing: 0.5,
  },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    marginTop: 8,
  },

  illustrationWrap: {
    flex: 1,
    marginHorizontal: -24,
    marginVertical: 12,
  },
  illustration: {
    width: "100%",
    height: "100%",
  },

  bottom: { paddingBottom: 18 },
  button: {
    backgroundColor: "#fff",
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: fonts.bold,
    color: colors.primary,
    fontSize: 16,
  },
  row: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
  small: {
    fontFamily: fonts.regular,
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
  },
  link: {
    fontFamily: fonts.bold,
    color: "#fff",
    fontSize: 13,
  },
});
