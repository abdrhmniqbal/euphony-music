export const DEFAULT_APP_THEME_ID = "default"

export type AppThemeId = "default" | "nord"

export interface AppThemeTokensVariant {
  background: string
  surface: string
  foreground: string
  muted: string
  accent: string
  border: string
  default: string
  link: string
  danger: string
  success: string
  warning: string
  accentForeground: string
  backdrop: string
  rainbow: string[]
}

export interface AppThemeTokens {
  light: AppThemeTokensVariant
  dark: AppThemeTokensVariant
}

export interface AppThemeDefinition {
  id: AppThemeId
  labelKey: string
  descriptionKey: string
  rootClassName: "theme-default" | "theme-nord"
  tokens: AppThemeTokens
}

export const APP_THEMES: AppThemeDefinition[] = [
  {
    id: DEFAULT_APP_THEME_ID,
    labelKey: "settings.appearance.theme.options.default.title",
    descriptionKey: "settings.appearance.theme.options.default.description",
    rootClassName: "theme-default",
    tokens: {
      light: {
        background: "#f4f4f5",
        surface: "#ffffff",
        foreground: "#09090b",
        muted: "#71717a",
        accent: "#3b82f6",
        border: "#e4e4e7",
        default: "#f4f4f5",
        link: "#09090b",
        danger: "#ef4444",
        success: "#22c55e",
        warning: "#f59e0b",
        accentForeground: "#ffffff",
        backdrop: "rgba(0, 0, 0, 0.2)",
        rainbow: [
          "#5bdd6a",
          "#35db80",
          "#20d6be",
          "#26d1d1",
          "#11cdf2",
          "#40b6ff",
          "#638dff",
          "#7979f7",
          "#a17df5",
          "#ce7af0",
          "#ff70b0",
          "#ff697a",
          "#ff875c",
          "#ffd86b",
          "#fdff78",
          "#98a0b3",
        ],
      },
      dark: {
        background: "#09090b",
        surface: "#18181b",
        foreground: "#fafafa",
        muted: "#a1a1aa",
        accent: "#3b82f6",
        border: "#27272a",
        default: "#27272a",
        link: "#fafafa",
        danger: "#ef4444",
        success: "#22c55e",
        warning: "#f59e0b",
        accentForeground: "#fafafa",
        backdrop: "rgba(0, 0, 0, 0.2)",
        rainbow: [
          "#5bdd6a",
          "#35db80",
          "#20d6be",
          "#26d1d1",
          "#11cdf2",
          "#40b6ff",
          "#638dff",
          "#7979f7",
          "#a17df5",
          "#ce7af0",
          "#ff70b0",
          "#ff697a",
          "#ff875c",
          "#ffd86b",
          "#fdff78",
          "#98a0b3",
        ],
      },
    },
  },
  {
    id: "nord",
    labelKey: "settings.appearance.theme.options.nord.title",
    descriptionKey: "settings.appearance.theme.options.nord.description",
    rootClassName: "theme-nord",
    tokens: {
      light: {
        background: "#eceff4",
        surface: "#e5e9f0",
        foreground: "#2e3440",
        muted: "#4c566a",
        accent: "#5e81ac",
        border: "#d8dee9",
        default: "#d8dee9",
        link: "#2e3440",
        danger: "#bf616a",
        success: "#a3be8c",
        warning: "#ebcb8b",
        accentForeground: "#eceff4",
        backdrop: "rgba(46, 52, 64, 0.2)",
        rainbow: ["#bf616a", "#d08770", "#ebcb8b", "#a3be8c", "#b48ead"],
      },
      dark: {
        background: "#2e3440",
        surface: "#3b4252",
        foreground: "#eceff4",
        muted: "#d8dee9",
        accent: "#88c0d0",
        border: "#4c566a",
        default: "#434c5e",
        link: "#eceff4",
        danger: "#bf616a",
        success: "#a3be8c",
        warning: "#ebcb8b",
        accentForeground: "#2e3440",
        backdrop: "rgba(0, 0, 0, 0.3)",
        rainbow: ["#bf616a", "#d08770", "#ebcb8b", "#a3be8c", "#b48ead"],
      },
    },
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
