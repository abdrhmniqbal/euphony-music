export interface SettingsRouteDefinition {
  name: string
  route: string
  titleKey: string
  descriptionKey?: string
  highlightId?: string
}

export interface SettingsSearchEntry {
  id: string
  route: string
  titleKey: string
  descriptionKey?: string
  sectionKey?: string
  highlight?: string
}

export const SETTINGS_CATEGORY_ROUTES: SettingsRouteDefinition[] = [
  {
    name: "appearance",
    route: "/settings/appearance",
    titleKey: "settings.routes.appearance.title",
    descriptionKey: "settings.routes.appearance.description",
  },
  {
    name: "audio",
    route: "/settings/audio",
    titleKey: "settings.routes.audio.title",
    descriptionKey: "settings.routes.audio.description",
  },
  {
    name: "library",
    route: "/settings/library",
    titleKey: "settings.routes.library.title",
    descriptionKey: "settings.routes.library.description",
  },
  {
    name: "notifications",
    route: "/settings/notifications",
    titleKey: "settings.routes.notifications.title",
    descriptionKey: "settings.routes.notifications.description",
  },
  {
    name: "integrations",
    route: "/settings/integrations",
    titleKey: "settings.routes.integrations.title",
    descriptionKey: "settings.routes.integrations.description",
  },
  {
    name: "backup",
    route: "/settings/backup",
    titleKey: "settings.routes.backup.title",
    descriptionKey: "settings.routes.backup.description",
  },
  {
    name: "advanced",
    route: "/settings/advanced",
    titleKey: "settings.routes.advanced.title",
    descriptionKey: "settings.routes.advanced.description",
  },
  {
    name: "about",
    route: "/settings/about",
    titleKey: "settings.routes.about.title",
    descriptionKey: "settings.routes.about.description",
  },
]

export const SETTINGS_SCREEN_TITLE_KEYS: Record<string, string> = {
  index: "settings.routes.index.title",
  appearance: "settings.routes.appearance.title",
  language: "settings.routes.language.title",
  audio: "settings.routes.audio.title",
  notifications: "settings.routes.notifications.title",
  library: "settings.routes.library.title",
  advanced: "settings.routes.advanced.title",
  about: "settings.routes.about.title",
  "folder-filters": "settings.routes.folderFilters.title",
  "split-multiple-values": "settings.routes.splitMultipleValues.title",
  "track-duration-filter": "settings.routes.trackDurationFilter.title",
  "log-level": "settings.routes.logLevel.title",
  "artist-split-mode": "settings.routes.artistSplitMode.title",
  "open-source-licenses": "settings.routes.about.title",
  "whats-new": "settings.routes.whatsNew.title",
  "theme-mode": "settings.routes.themeMode.title",
  theme: "settings.routes.theme.title",
  onboarding: "settings.routes.onboarding.title",
  "library-tabs": "settings.routes.libraryTabs.title",
  integrations: "settings.routes.integrations.title",
  backup: "settings.routes.backup.title",
  "auto-backup": "settings.routes.autoBackup.title",
}

export const SETTINGS_SEARCH_ENTRIES: SettingsSearchEntry[] = [
  { id: "theme", route: "/settings/theme", titleKey: "settings.routes.theme.title", descriptionKey: "settings.routes.theme.description", sectionKey: "settings.routes.appearance.title" },
  { id: "theme-mode", route: "/settings/theme-mode", titleKey: "settings.routes.themeMode.title", sectionKey: "settings.routes.appearance.title" },
  { id: "language", route: "/settings/language", titleKey: "settings.routes.language.title", sectionKey: "settings.routes.appearance.title" },
]
