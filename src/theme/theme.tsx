import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform, TextStyle, ViewStyle } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AppColors,
  ThemeName,
  defaultTheme,
  fonts,
  getTheme,
  themes,
} from "./themes";

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
} as const;

export const typography = {
  h1: { fontFamily: fonts.bold, fontSize: fontSize.xxxl, lineHeight: 42 },
  h2: { fontFamily: fonts.bold, fontSize: fontSize.xxl, lineHeight: 36 },
  h3: { fontFamily: fonts.semiBold, fontSize: fontSize.xl, lineHeight: 30 },
  title: { fontFamily: fonts.semiBold, fontSize: fontSize.lg, lineHeight: 26 },
  body: { fontFamily: fonts.regular, fontSize: fontSize.md, lineHeight: 24 },
  bodyMedium: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    lineHeight: 24,
  },
  small: { fontFamily: fonts.regular, fontSize: fontSize.sm, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: fontSize.xs, lineHeight: 16 },
  button: { fontFamily: fonts.semiBold, fontSize: fontSize.md, lineHeight: 22 },
} satisfies Record<string, TextStyle>;

export const sizes = {
  icon: { sm: 16, md: 20, lg: 24, xl: 32 },
  avatar: { sm: 32, md: 44, lg: 64, xl: 96 },
  button: { sm: 36, md: 48, lg: 56 },
  input: 48,
  headerHeight: 56,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
} as const;

const makeShadows = (c: AppColors) => {
  const base = (
    offsetY: number,
    opacity: number,
    blur: number,
    elevation: number,
  ): ViewStyle =>
    Platform.select<ViewStyle>({
      ios: {
        shadowColor: c.shadow,
        shadowOffset: { width: 0, height: offsetY },
        shadowOpacity: opacity,
        shadowRadius: blur,
      },
      default: { elevation, shadowColor: c.shadow },
    })!;

  return {
    none: {} as ViewStyle,
    sm: base(1, 0.08, 2, 1),
    md: base(4, 0.12, 8, 4),
    lg: base(8, 0.18, 16, 8),
  };
};

export type Theme = {
  name: ThemeName;
  colors: AppColors;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fonts: typeof fonts;
  typography: typeof typography;
  sizes: typeof sizes;
  shadows: ReturnType<typeof makeShadows>;
};

export const buildTheme = (name: ThemeName): Theme => {
  const colors = getTheme(name);
  return {
    name,
    colors,
    spacing,
    radius,
    fontSize,
    fonts,
    typography,
    sizes,
    shadows: makeShadows(colors),
  };
};

type Ctx = Theme & { setTheme: (n: ThemeName) => void };
const ThemeContext = createContext<Ctx>(null as unknown as Ctx);

const STORAGE_KEY = "app-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState<ThemeName>(defaultTheme);

  useEffect(() => {
    let active = true;

    const loadTheme = async () => {
      try {
        const saved: string | null = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && saved && saved in themes) {
          setName(saved as ThemeName);
        }
      } catch {}
    };

    loadTheme();
    return () => {
      active = false;
    };
  }, []);

  const setTheme = (n: ThemeName) => {
    setName(n);
    AsyncStorage.setItem(STORAGE_KEY, n).catch(() => {});
  };

  const value = useMemo(() => ({ ...buildTheme(name), setTheme }), [name]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

export function makeUseStyles<T extends Record<string, ViewStyle | TextStyle>>(
  factory: (theme: Theme) => T,
) {
  return function useStyles(): T {
    const { setTheme, ...theme } = useTheme();
    return useMemo(() => factory(theme as Theme), [theme.name]);
  };
}

export const alpha = (hex: string, a: number): string => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};
