import { useColorScheme } from "react-native"

import { usePreferenceStore } from "@/stores/preference/store"
import { useSettingsStore } from "@/modules/settings/store"

export type { ThemeColors } from "./static-themes"
import { STATIC_THEMES } from "./static-themes"
export { STATIC_THEMES }

export function useThemeColors() {
  const themeMode = usePreferenceStore((state) => state.theme)
  const themeId = useSettingsStore((state) => state.themeConfig.themeId)
  const systemScheme = useColorScheme()

  const isDark = themeMode === "dark" || (themeMode === "system" && systemScheme === "dark")
  const activeTheme = STATIC_THEMES[themeId] || STATIC_THEMES.default

  return isDark ? activeTheme.dark : activeTheme.light
}
