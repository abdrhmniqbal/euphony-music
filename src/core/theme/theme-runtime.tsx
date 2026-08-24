import { useEffect } from "react"
import { StatusBar, useColorScheme } from "react-native"
import { Uniwind } from "uniwind"

import { usePreferenceStore } from "@/core/preferences/store"
import type { AppThemeId } from "@/core/theme/registry"

export type ResolvedUniwindTheme = `theme-${AppThemeId}-${"light" | "dark"}`

export function resolveIsDarkTheme(
  themeMode: string,
  systemScheme: string | null | undefined
): boolean {
  return themeMode === "dark" || (themeMode === "system" && systemScheme === "dark")
}

export function resolveUniwindTheme(
  themeId: AppThemeId,
  themeMode: string,
  systemScheme: string | null | undefined
): ResolvedUniwindTheme {
  const mode = resolveIsDarkTheme(themeMode, systemScheme) ? "dark" : "light"
  return `theme-${themeId}-${mode}`
}

export function ThemeRuntime() {
  const themeId = usePreferenceStore((state) => state.themeId)
  const themeMode = usePreferenceStore((state) => state.themeMode)
  const systemScheme = useColorScheme()

  const isDark = resolveIsDarkTheme(themeMode, systemScheme)

  useEffect(() => {
    Uniwind.setTheme(resolveUniwindTheme(themeId, themeMode, systemScheme))
  }, [themeId, themeMode, systemScheme])

  return <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
}
