import { useColorScheme } from "react-native"

import { usePreferenceStore } from "@/stores/preference/store"
import { useSettingsStore } from "@/modules/settings/store"
import { getAppThemeDefinition } from "./theme-registry"

export interface ThemeColors {
  background: string
  foreground: string
  default: string
  muted: string
  accent: string
  border: string
  link: string
  danger: string
  success: string
  warning: string
  accentForeground: string
  backdrop: string
  rainbow: string[]
}

export function useThemeColors(): ThemeColors {
  const themeMode = usePreferenceStore((state) => state.theme)
  const themeId = useSettingsStore((state) => state.themeConfig.themeId)
  const systemScheme = useColorScheme()

  // Fast evaluation of dark mode matching Uniwind's adaptive resolution
  const isDark = themeMode === "dark" || (themeMode === "system" && systemScheme === "dark")

  const appTheme = getAppThemeDefinition(themeId)
  return isDark ? appTheme.tokens.dark : appTheme.tokens.light
}
