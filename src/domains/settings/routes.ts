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

export const SETTINGS_SCREEN_TITLE_KEYS = {
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
} satisfies Record<string, string>

export const SETTINGS_SEARCH_ENTRIES: SettingsSearchEntry[] = [
  { id: "theme", route: "/settings/theme", titleKey: "settings.routes.theme.title", descriptionKey: "settings.routes.theme.description", sectionKey: "settings.routes.appearance.title" },
  { id: "theme-mode", route: "/settings/theme-mode", titleKey: "settings.routes.themeMode.title", descriptionKey: "settings.routes.themeMode.description", sectionKey: "settings.routes.appearance.title" },
  { id: "language", route: "/settings/language", titleKey: "settings.routes.language.title", sectionKey: "settings.routes.appearance.title" },

  { id: "fade-play-pause-stop", route: "/settings/audio", titleKey: "settings.audio.fadePlayPauseStop", sectionKey: "settings.routes.audio.title", highlight: "audio" },
  { id: "crossfade", route: "/settings/audio", titleKey: "settings.audio.crossfade", descriptionKey: "settings.audio.durationHint", sectionKey: "settings.routes.audio.title", highlight: "audio" },
  { id: "resume-after-call", route: "/settings/audio", titleKey: "settings.audio.resumeAfterCall", sectionKey: "settings.routes.audio.title", highlight: "audio" },
  { id: "duck-volume", route: "/settings/audio", titleKey: "settings.audio.duckVolume", sectionKey: "settings.routes.audio.title", highlight: "audio" },
  { id: "pause-in-call", route: "/settings/audio", titleKey: "settings.audio.pauseInCall", sectionKey: "settings.routes.audio.title", highlight: "audio" },

  { id: "folder-filters", route: "/settings/folder-filters", titleKey: "settings.routes.folderFilters.title", descriptionKey: "settings.library.folderFiltersDescription", sectionKey: "settings.routes.library.title" },
  { id: "track-duration-filter", route: "/settings/track-duration-filter", titleKey: "settings.routes.trackDurationFilter.title", sectionKey: "settings.routes.library.title" },
  { id: "count-as-played", route: "/settings/library", titleKey: "settings.library.countAsPlayed", descriptionKey: "settings.library.countAsPlayedDescription", sectionKey: "settings.routes.library.title", highlight: "countAsPlayed" },
  { id: "split-multiple-values", route: "/settings/split-multiple-values", titleKey: "settings.library.splitMultipleValues", descriptionKey: "settings.library.artistCharDelimitersDescription", sectionKey: "settings.routes.library.title" },
  { id: "artist-split-mode", route: "/settings/artist-split-mode", titleKey: "settings.library.artistSplitMode", sectionKey: "settings.routes.library.title" },
  { id: "library-tabs", route: "/settings/library-tabs", titleKey: "settings.routes.libraryTabs.title", descriptionKey: "settings.library.libraryTabsDescription", sectionKey: "settings.routes.library.title" },
  { id: "auto-scan", route: "/settings/library", titleKey: "settings.library.autoScan", descriptionKey: "settings.library.autoScanDescription", sectionKey: "settings.routes.library.title", highlight: "autoScan" },
  { id: "reindex", route: "/settings/library", titleKey: "settings.library.reindexLibrary", descriptionKey: "settings.library.reindexDescription", sectionKey: "settings.routes.library.title", highlight: "reindex" },

  { id: "app-update-notifications", route: "/settings/notifications", titleKey: "settings.notifications.appUpdateNotifications", sectionKey: "settings.routes.notifications.title" },
  { id: "indexer-notifications", route: "/settings/notifications", titleKey: "settings.notifications.indexerNotifications", sectionKey: "settings.routes.notifications.title" },

  { id: "backup", route: "/settings/backup", titleKey: "settings.backup.backup", descriptionKey: "settings.backup.backupDescription", sectionKey: "settings.routes.backup.title" },
  { id: "restore", route: "/settings/backup", titleKey: "settings.backup.restore", descriptionKey: "settings.backup.restoreDescription", sectionKey: "settings.routes.backup.title" },
  { id: "auto-backup", route: "/settings/auto-backup", titleKey: "settings.autoBackup.title", sectionKey: "settings.routes.backup.title" },

  { id: "log-level", route: "/settings/log-level", titleKey: "settings.routes.logLevel.title", descriptionKey: "settings.routes.logLevel.description", sectionKey: "settings.routes.advanced.title" },
  { id: "share-crash-logs", route: "/settings/advanced", titleKey: "settings.advanced.shareCrashLogs", descriptionKey: "settings.advanced.shareCrashLogsDescription", sectionKey: "settings.routes.advanced.title" },
  { id: "reset-listening-history", route: "/settings/advanced", titleKey: "settings.advanced.resetListeningHistory", descriptionKey: "settings.advanced.resetListeningHistoryDescription", sectionKey: "settings.routes.advanced.title", highlight: "resetHistory" },
  { id: "reset-search-history", route: "/settings/advanced", titleKey: "settings.advanced.resetSearchHistory", descriptionKey: "settings.advanced.resetSearchHistoryDescription", sectionKey: "settings.routes.advanced.title", highlight: "resetHistory" },
  { id: "force-update-mixes", route: "/settings/advanced", titleKey: "settings.advanced.forceUpdateMixes", descriptionKey: "settings.advanced.forceUpdateMixesDescription", sectionKey: "settings.routes.advanced.title", highlight: "forceUpdateMixes" },
  { id: "battery-optimization", route: "/settings/advanced", titleKey: "settings.advanced.disableBatteryOptimization", descriptionKey: "settings.advanced.disableBatteryOptimizationAndroid", sectionKey: "settings.routes.advanced.title", highlight: "batteryOptimization" },
  { id: "dont-kill-my-app", route: "/settings/advanced", titleKey: "settings.advanced.dontKillMyApp", descriptionKey: "settings.advanced.dontKillMyAppDescription", sectionKey: "settings.routes.advanced.title", highlight: "dontKillMyApp" },
  { id: "restart-onboarding", route: "/settings/advanced", titleKey: "settings.routes.onboarding.title", descriptionKey: "settings.advanced.restartOnboardingDescription", sectionKey: "settings.routes.advanced.title", highlight: "restartOnboarding" },

  { id: "github", route: "/settings/about", titleKey: "settings.about.github", descriptionKey: "settings.about.repositoryDescription", sectionKey: "settings.routes.about.title" },
  { id: "open-source-licenses", route: "/settings/open-source-licenses", titleKey: "settings.about.openSourceLicenses", descriptionKey: "settings.about.openSourceLicensesDescription", sectionKey: "settings.routes.about.title" },
]
