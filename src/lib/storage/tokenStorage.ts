import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "chatty_token";

const useSecure = Platform.OS !== "web";

let memory: string | null = null;

export const tokenStorage = {
  async get(): Promise<string | null> {
    if (memory) return memory;
    try {
      const v = useSecure
        ? await SecureStore.getItemAsync(TOKEN_KEY)
        : await AsyncStorage.getItem(TOKEN_KEY);
      memory = v;
      return v;
    } catch (e) {
      console.log("tokenStorage.get failed", e);
      return memory;
    }
  },

  async set(token: string): Promise<void> {
    memory = token;
    try {
      if (useSecure) await SecureStore.setItemAsync(TOKEN_KEY, token);
      else await AsyncStorage.setItem(TOKEN_KEY, token);
      const back = useSecure
        ? await SecureStore.getItemAsync(TOKEN_KEY)
        : await AsyncStorage.getItem(TOKEN_KEY);
      console.log(
        back === token
          ? `TOKEN STORED OK (len ${token.length})`
          : "TOKEN STORE MISMATCH (saved but read-back differs)",
      );
    } catch (e) {
      console.log("TOKEN STORE FAILED", e);
    }
  },

  async clear(): Promise<void> {
    memory = null;
    try {
      if (useSecure) await SecureStore.deleteItemAsync(TOKEN_KEY);
      else await AsyncStorage.removeItem(TOKEN_KEY);
      console.log("TOKEN CLEARED");
    } catch (e) {
      console.log("tokenStorage.clear failed", e);
    }
  },
};
