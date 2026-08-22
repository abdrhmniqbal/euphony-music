import { useColorScheme } from "react-native"

import { usePreferenceStore } from "@/core/preferences/store"

import { getStaticThemeColors, type ThemeColors } from "./colors"

export function useIsDarkTheme() {
  const themeMode = usePreferenceStore((state) => state.themeMode)
  const systemScheme = useColorScheme()
  return themeMode === "dark" || (themeMode === "system" && systemScheme === "dark")
}

export function useThemeColors(): ThemeColors {
  const themeId = usePreferenceStore((state) => state.themeId)
  const isDark = useIsDarkTheme()
  return getStaticThemeColors(themeId, isDark)
}
