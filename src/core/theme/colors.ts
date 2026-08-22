import { STATIC_THEMES, type ThemeColors } from "./static-themes"

export { STATIC_THEMES }
export type { ThemeColors }

export function getStaticThemeColors(themeId: string, isDark: boolean): ThemeColors {
  const theme = STATIC_THEMES[themeId] ?? STATIC_THEMES.default
  return isDark ? theme.dark : theme.light
}
