export const DEFAULT_APP_THEME_ID = "default"

export type AppThemeId =
  | "default"
  | "nord"
  | "dracula"
  | "catppuccin"
  | "tokyo"
  | "gruvbox"
  | "everforest"
  | "rose-pine"
  | "solarized"
  | "ayu"
  | "monochrome"
  | "aquamarine"
  | "crimson-pulse"
  | "banana-breeze"
  | "candy-pop"

export interface AppThemeDefinition {
  id: AppThemeId
  labelKey: string
  descriptionKey: string
  rootClassName:
    | "theme-default"
    | "theme-nord"
    | "theme-dracula"
    | "theme-catppuccin"
    | "theme-tokyo"
    | "theme-gruvbox"
    | "theme-everforest"
    | "theme-rose-pine"
    | "theme-solarized"
    | "theme-ayu"
    | "theme-monochrome"
    | "theme-aquamarine"
    | "theme-crimson-pulse"
    | "theme-banana-breeze"
    | "theme-candy-pop"
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
  {
    id: "tokyo",
    labelKey: "settings.appearance.theme.options.tokyo.title",
    descriptionKey: "settings.appearance.theme.options.tokyo.description",
    rootClassName: "theme-tokyo",
  },
  {
    id: "gruvbox",
    labelKey: "settings.appearance.theme.options.gruvbox.title",
    descriptionKey: "settings.appearance.theme.options.gruvbox.description",
    rootClassName: "theme-gruvbox",
  },
  {
    id: "everforest",
    labelKey: "settings.appearance.theme.options.everforest.title",
    descriptionKey: "settings.appearance.theme.options.everforest.description",
    rootClassName: "theme-everforest",
  },
  {
    id: "rose-pine",
    labelKey: "settings.appearance.theme.options.rose-pine.title",
    descriptionKey: "settings.appearance.theme.options.rose-pine.description",
    rootClassName: "theme-rose-pine",
  },
  {
    id: "solarized",
    labelKey: "settings.appearance.theme.options.solarized.title",
    descriptionKey: "settings.appearance.theme.options.solarized.description",
    rootClassName: "theme-solarized",
  },
  {
    id: "ayu",
    labelKey: "settings.appearance.theme.options.ayu.title",
    descriptionKey: "settings.appearance.theme.options.ayu.description",
    rootClassName: "theme-ayu",
  },
  {
    id: "monochrome",
    labelKey: "settings.appearance.theme.options.monochrome.title",
    descriptionKey: "settings.appearance.theme.options.monochrome.description",
    rootClassName: "theme-monochrome",
  },
  {
    id: "aquamarine",
    labelKey: "settings.appearance.theme.options.aquamarine.title",
    descriptionKey: "settings.appearance.theme.options.aquamarine.description",
    rootClassName: "theme-aquamarine",
  },
  {
    id: "crimson-pulse",
    labelKey: "settings.appearance.theme.options.crimson-pulse.title",
    descriptionKey: "settings.appearance.theme.options.crimson-pulse.description",
    rootClassName: "theme-crimson-pulse",
  },
  {
    id: "banana-breeze",
    labelKey: "settings.appearance.theme.options.banana-breeze.title",
    descriptionKey: "settings.appearance.theme.options.banana-breeze.description",
    rootClassName: "theme-banana-breeze",
  },
  {
    id: "candy-pop",
    labelKey: "settings.appearance.theme.options.candy-pop.title",
    descriptionKey: "settings.appearance.theme.options.candy-pop.description",
    rootClassName: "theme-candy-pop",
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
