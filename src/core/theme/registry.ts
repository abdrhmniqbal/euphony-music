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
  rootClassName: `theme-${AppThemeId}`
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

export function getAppThemeDefinition(id: string): AppThemeDefinition {
  return APP_THEMES.find((theme) => theme.id === id) ?? APP_THEMES[0]
}
