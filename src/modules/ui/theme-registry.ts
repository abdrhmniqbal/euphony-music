export const DEFAULT_APP_THEME_ID = "default"

export type AppThemeId = "default" | "nord" | "dracula" | "catppuccin"

export interface AppThemeDefinition {
  id: AppThemeId
  labelKey: string
  descriptionKey: string
  rootClassName: "theme-default" | "theme-nord" | "theme-dracula" | "theme-catppuccin"
}

export const APP_THEMES: AppThemeDefinition[] = [
  {
    id: "default",
    labelKey: "settings.appearance.theme.options.default.title",
    descriptionKey: "settings.appearance.theme.options.default.description",
    rootClassName: "theme-default",
  },
  {
    id: "nord",
    labelKey: "settings.appearance.theme.options.nord.title",
    descriptionKey: "settings.appearance.theme.options.nord.description",
    rootClassName: "theme-nord",
  },
  {
    id: "dracula",
    labelKey: "settings.appearance.theme.options.dracula.title",
    descriptionKey: "settings.appearance.theme.options.dracula.description",
    rootClassName: "theme-dracula",
  },
  {
    id: "catppuccin",
    labelKey: "settings.appearance.theme.options.catppuccin.title",
    descriptionKey: "settings.appearance.theme.options.catppuccin.description",
    rootClassName: "theme-catppuccin",
  },
]

export function isAppThemeId(value: unknown): value is AppThemeId {
  return APP_THEMES.some((theme) => theme.id === value)
}

export function getAppThemeDefinition(themeId: string): AppThemeDefinition {
  return APP_THEMES.find((theme) => theme.id === themeId) ?? APP_THEMES[0]!
}

const LEGACY_GENRE_RAINBOW_COLORS = [
  "bg-rainbow-lime",
  "bg-rainbow-teal",
  "bg-rainbow-cyan",
  "bg-rainbow-blue",
  "bg-rainbow-indigo",
  "bg-rainbow-purple",
  "bg-rainbow-magenta",
  "bg-rainbow-red",
  "bg-rainbow-orange",
  "bg-rainbow-amber",
] as const

export function resolveRainbowColor(
  rainbow: readonly string[],
  colorToken: string,
  fallbackIndex = 0
) {
  if (rainbow.length === 0) return "#3b82f6"

  const legacyIndex = LEGACY_GENRE_RAINBOW_COLORS.indexOf(
    colorToken as (typeof LEGACY_GENRE_RAINBOW_COLORS)[number]
  )
  const parsedIndex = Number.parseInt(colorToken, 10)
  const index =
    legacyIndex >= 0
      ? legacyIndex
      : Number.isInteger(parsedIndex) && parsedIndex >= 0
        ? parsedIndex
        : fallbackIndex

  return rainbow[index % rainbow.length] ?? rainbow[0]!
}
