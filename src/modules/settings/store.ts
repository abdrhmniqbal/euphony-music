/**
 * Purpose: Stores local settings defaults and the app-wide settings state.
 * Caller: Settings screens, localization, settings persistence modules, bootstrap preload, and services reading preferences.
 * Dependencies: Zustand, settings type definitions, installed app version metadata.
 * Main Functions: useSettingsStore, getSettingsState(), updateSettingsState(), default config getters.
 * Side Effects: Mutates in-memory Zustand settings state.
 */

import { create } from "zustand"

import { getDefaultLibraryTabsConfig } from "@/modules/library/tabs"
import { getCurrentAppVersion, isPreviewReleaseVersion } from "@/modules/updates/app-version"
import type {
  AudioPlaybackConfig,
  AppUpdateConfig,
  CountAsPlayedConfig,
  CrossfadeConfig,
  FolderFilterConfig,
  IndexerScanConfig,
  LanguageCode,
  LibraryTabsConfig,
  LoggingConfig,
  SplitMultipleValueConfig,
  TrackDurationFilterConfig,
  ThemeConfig,
  AutoBackupConfig,
} from "./types"

const DEFAULT_LANGUAGE_CODE: LanguageCode = "en"
const DEFAULT_INDEXER_NOTIFICATIONS_ENABLED = true
const DEFAULT_APP_UPDATE_CONFIG: AppUpdateConfig = {
  notificationsEnabled: true,
  includePrereleases: isPreviewReleaseVersion(getCurrentAppVersion()),
}
const DEFAULT_INDEXER_SCAN_CONFIG: IndexerScanConfig = {
  autoScanEnabled: true,
  rescanImmediatelyEnabled: false,
  initialScanEnabled: true,
}
const DEFAULT_CROSSFADE_CONFIG: CrossfadeConfig = {
  isEnabled: false,
  durationSeconds: 5,
}
const DEFAULT_AUDIO_PLAYBACK_CONFIG: AudioPlaybackConfig = {
  fadePlayPauseStop: true,
  fadeOnSeek: false,
  resumeAfterCall: true,
  resumeOnStart: false,
  resumeOnReopen: false,
  shortAudioFocusChange: false,
  pauseInCall: true,
  resumeOnFocusGain: true,
  duckVolume: true,
  permanentAudioFocusChange: true,
}
const DEFAULT_FOLDER_FILTER_CONFIG: FolderFilterConfig = {
  whitelist: [],
  blacklist: [],
}
const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  level: "minimal",
}
const DEFAULT_TRACK_DURATION_FILTER: TrackDurationFilterConfig = {
  mode: "off",
  customMinimumSeconds: 180,
}
const DEFAULT_COUNT_AS_PLAYED_CONFIG: CountAsPlayedConfig = {
  minimumPlayedPercent: 15,
}

const DEFAULT_SPLIT_MULTIPLE_VALUE_CONFIG: SplitMultipleValueConfig = {
  artistSplitSymbols: [";", "/", "&", ",", "ft.", "feat."],
  unsplitArtists: [],
  artistSplitMode: "split",
  genreSplitSymbols: [";", "/", ","],
}

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  themeId: "default",
}
const DEFAULT_AUTO_BACKUP_CONFIG: AutoBackupConfig = {
  enabled: false,
  intervalHours: 24,
  lastBackupAt: 0,
  targetDirectoryUri: null,
}

interface SettingsState {
  _hasHydrated: boolean
  languageCode: LanguageCode
  indexerScanConfig: IndexerScanConfig
  indexerNotificationsEnabled: boolean
  appUpdateConfig: AppUpdateConfig
  crossfadeConfig: CrossfadeConfig
  audioPlaybackConfig: AudioPlaybackConfig
  folderFilterConfig: FolderFilterConfig
  loggingConfig: LoggingConfig
  trackDurationFilterConfig: TrackDurationFilterConfig
  countAsPlayedConfig: CountAsPlayedConfig
  splitMultipleValueConfig: SplitMultipleValueConfig
  themeConfig: ThemeConfig
  libraryTabsConfig: LibraryTabsConfig
  autoBackupConfig: AutoBackupConfig
}

export const useSettingsStore = create<SettingsState>(() => ({
  _hasHydrated: false,
  languageCode: DEFAULT_LANGUAGE_CODE,
  indexerScanConfig: DEFAULT_INDEXER_SCAN_CONFIG,
  indexerNotificationsEnabled: DEFAULT_INDEXER_NOTIFICATIONS_ENABLED,
  appUpdateConfig: DEFAULT_APP_UPDATE_CONFIG,
  crossfadeConfig: DEFAULT_CROSSFADE_CONFIG,
  audioPlaybackConfig: DEFAULT_AUDIO_PLAYBACK_CONFIG,
  folderFilterConfig: DEFAULT_FOLDER_FILTER_CONFIG,
  loggingConfig: DEFAULT_LOGGING_CONFIG,
  trackDurationFilterConfig: DEFAULT_TRACK_DURATION_FILTER,
  countAsPlayedConfig: DEFAULT_COUNT_AS_PLAYED_CONFIG,
  splitMultipleValueConfig: DEFAULT_SPLIT_MULTIPLE_VALUE_CONFIG,
  themeConfig: DEFAULT_THEME_CONFIG,
  libraryTabsConfig: getDefaultLibraryTabsConfig(),
  autoBackupConfig: DEFAULT_AUTO_BACKUP_CONFIG,
}))

export function getDefaultIndexerScanConfig() {
  return DEFAULT_INDEXER_SCAN_CONFIG
}

export function getDefaultLoggingConfig() {
  return DEFAULT_LOGGING_CONFIG
}

export function getDefaultIndexerNotificationsEnabled() {
  return DEFAULT_INDEXER_NOTIFICATIONS_ENABLED
}

export function getDefaultAppUpdateConfig() {
  return DEFAULT_APP_UPDATE_CONFIG
}

export function getDefaultCrossfadeConfig() {
  return DEFAULT_CROSSFADE_CONFIG
}

export function getDefaultAudioPlaybackConfig() {
  return DEFAULT_AUDIO_PLAYBACK_CONFIG
}

export function getDefaultFolderFilterConfig() {
  return DEFAULT_FOLDER_FILTER_CONFIG
}

export function getDefaultTrackDurationFilterConfig() {
  return DEFAULT_TRACK_DURATION_FILTER
}

export function getDefaultCountAsPlayedConfig() {
  return DEFAULT_COUNT_AS_PLAYED_CONFIG
}

export function getSettingsState() {
  return useSettingsStore.getState()
}

export function updateSettingsState(updates: Partial<SettingsState>) {
  useSettingsStore.setState(updates)
}

export function getDefaultSplitMultipleValueConfig() {
  return DEFAULT_SPLIT_MULTIPLE_VALUE_CONFIG
}

export function getDefaultThemeConfig() {
  return DEFAULT_THEME_CONFIG
}


