import { useCSSVariable, useUniwind } from "uniwind"

export interface ThemeColors {
  background: string
  foreground: string
  default: string
  muted: string
  accent: string
  border: string
  link: string
}

const FALLBACK_LIGHT_THEME: ThemeColors = {
  background: "#ffffff",
  foreground: "#09090b",
  default: "#f4f4f5",
  muted: "#71717a",
  accent: "#3b82f6",
  border: "#e4e4e7",
  link: "#2563eb",
}

const FALLBACK_DARK_THEME: ThemeColors = {
  background: "#09090b",
  foreground: "#fafafa",
  default: "#27272a",
  muted: "#a1a1aa",
  accent: "#3b82f6",
  border: "#27272a",
  link: "#3b82f6",
}

function asColor(value: string | number | undefined, fallback: string) {
  if (typeof value === "string" && value.length > 0) {
    return value
  }

  return fallback
}

export function useThemeColors(): ThemeColors {
  const { theme: currentTheme } = useUniwind()
  const [background, foreground, defaultColor, muted, accent, border, link] =
    useCSSVariable([
      "--color-background",
      "--color-foreground",
      "--color-default",
      "--color-muted",
      "--color-accent",
      "--color-border",
      "--color-link",
    ])

  const fallbackTheme =
    currentTheme === "dark" ? FALLBACK_DARK_THEME : FALLBACK_LIGHT_THEME

  return {
    background: asColor(background, fallbackTheme.background),
    foreground: asColor(foreground, fallbackTheme.foreground),
    default: asColor(defaultColor, fallbackTheme.default),
    muted: asColor(muted, fallbackTheme.muted),
    accent: asColor(accent, fallbackTheme.accent),
    border: asColor(border, fallbackTheme.border),
    link: asColor(link, fallbackTheme.link),
  }
}
