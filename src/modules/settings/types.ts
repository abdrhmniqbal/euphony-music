/**
 * Purpose: Defines settings route names and local settings configuration shapes.
 * Caller: Settings routes, settings screens, settings store, localization, and settings persistence modules.
 * Dependencies: Localization language types.
 * Main Functions: SettingsRouteName, SettingsRouteDefinition, IndexerScanConfig, CountAsPlayedConfig, CrossfadeConfig, AudioPlaybackConfig, AppUpdateConfig.
 * Side Effects: None.
 */

import type { LanguageCode } from "@/modules/localization/types"

export type SettingsRouteName =
  | "index"
  | "appearance"
  | "language"
  | "audio"
  | "notifications"
  | "library"
  | "advanced"
  | "about"
  | "folder-filters"
  | "split-multiple-values"
  | "track-duration-filter"
  | "log-level"
  | "artist-split-mode"
  | "open-source-licenses"
  | "whats-new"

export interface SettingsRouteDefinition {
  name: SettingsRouteName
  titleKey: string
  descriptionKey?: string
}

export type { LanguageCode }

export type AppLogLevel = "minimal" | "extra"

export interface LoggingConfig {
  level: AppLogLevel
}

export interface AppUpdateConfig {
  notificationsEnabled: boolean
  includePrereleases: boolean
  lastNotifiedVersion?: string
}

export interface IndexerScanConfig {
  autoScanEnabled: boolean
  rescanImmediatelyEnabled: boolean
  initialScanEnabled: boolean
}

export type FolderFilterMode = "whitelist" | "blacklist"

export interface FolderFilterConfig {
  whitelist: string[]
  blacklist: string[]
}

export type TrackDurationFilterMode =
  | "off"
  | "min30s"
  | "min60s"
  | "min120s"
  | "custom"

export interface TrackDurationFilterConfig {
  mode: TrackDurationFilterMode
  customMinimumSeconds: number
}

export interface CountAsPlayedConfig {
  minimumPlayedPercent: number
}

export interface CrossfadeConfig {
  isEnabled: boolean
  durationSeconds: number
}

export interface AudioPlaybackConfig {
  fadePlayPauseStop: boolean
  fadeOnSeek: boolean
  resumeAfterCall: boolean
  resumeOnStart: boolean
  resumeOnReopen: boolean
  shortAudioFocusChange: boolean
  pauseInCall: boolean
  resumeOnFocusGain: boolean
  duckVolume: boolean
  permanentAudioFocusChange: boolean
}

export type ArtistSplitMode = "original" | "split"

export interface SplitMultipleValueConfig {
  artistSplitSymbols: string[]
  unsplitArtists: string[]
  artistSplitMode: ArtistSplitMode
  genreSplitSymbols: string[]
}
