import { useMemo } from "react";
import { useCSSVariable, useUniwind } from "uniwind";

export interface ThemeColors {
  background: string;
  foreground: string;
  default: string;
  muted: string;
  accent: string;
  divider: string;
  link: string;
}

const FALLBACK_LIGHT_THEME: ThemeColors = {
  background: "#ffffff",
  foreground: "#09090b",
  default: "#f4f4f5",
  muted: "#71717a",
  accent: "#3b82f6",
  divider: "#e4e4e7",
  link: "#2563eb",
};

const FALLBACK_DARK_THEME: ThemeColors = {
  background: "#09090b",
  foreground: "#fafafa",
  default: "#27272a",
  muted: "#a1a1aa",
  accent: "#3b82f6",
  divider: "#27272a",
  link: "#3b82f6",
};

const asColor = (value: string | number | undefined, fallback: string) => {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return fallback;
};

export function useThemeColors(): ThemeColors {
  const { theme: currentTheme } = useUniwind();
  const [background, foreground, defaultColor, muted, accent, divider, link] = useCSSVariable([
    "--color-background",
    "--color-foreground",
    "--color-default",
    "--color-muted",
    "--color-accent",
    "--color-divider",
    "--color-link",
  ]);

  const fallbackTheme = currentTheme === "dark" ? FALLBACK_DARK_THEME : FALLBACK_LIGHT_THEME;

  return useMemo(
    () => ({
      background: asColor(background, fallbackTheme.background),
      foreground: asColor(foreground, fallbackTheme.foreground),
      default: asColor(defaultColor, fallbackTheme.default),
      muted: asColor(muted, fallbackTheme.muted),
      accent: asColor(accent, fallbackTheme.accent),
      divider: asColor(divider, fallbackTheme.divider),
      link: asColor(link, fallbackTheme.link),
    }),
    [accent, background, defaultColor, divider, fallbackTheme, foreground, link, muted],
  );
}
