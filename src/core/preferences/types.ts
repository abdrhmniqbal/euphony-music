import type { AppThemeId } from "@/core/theme/registry"
import type { LanguageCode } from "@/core/localization/types"
import type { LibraryTabsConfig } from "./library-tabs"

export type ThemeMode = "system" | "light" | "dark"

export type NowPlayingDesign = "plain" | "vinyl" | "vinylOld"

export type Font = "NType" | "Roboto" | "Inter" | "GeistMono"

export type NavTab = "home" | "folder" | "playlist" | "track" | "album" | "artist" | "genre"

export const NAV_TABS: NavTab[] = [
  "home",
  "folder",
  "playlist",
  "track",
  "album",
  "artist",
  "genre",
]

export type ArtistSplitMode = "original" | "split"

export type TrackDurationFilterMode = "off" | "min30s" | "min60s" | "min120s" | "custom"

export type AppLogLevel = "minimal" | "extra"

export interface IndexerScanConfig {
  autoScanEnabled: boolean
  rescanImmediatelyEnabled: boolean
  initialScanEnabled: boolean
}

export interface FolderFilterConfig {
  whitelist: string[]
  blacklist: string[]
}

export interface TrackDurationFilterConfig {
  mode: TrackDurationFilterMode
  customMinimumSeconds: number
}

export interface CountAsPlayedConfig {
  minimumPlayedPercent: number
  minimumSeconds: number
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

export interface AppUpdateConfig {
  notificationsEnabled: boolean
  includePrereleases: boolean
  lastNotifiedVersion?: string
}

export interface SplitMultipleValueConfig {
  artistSplitMode: ArtistSplitMode
  artistCharDelimiters: string[]
  artistWordDelimiters: string[]
  extractArtistFromTitle: boolean
  unsplitArtists: string[]
  genreSplitSymbols: string[]
}

export interface AutoBackupConfig {
  enabled: boolean
  intervalHours: number
  lastBackupAt: number
  targetDirectoryUri: string | null
}

export interface PreferenceState {
  _hasHydrated: boolean

  // Appearance & localization
  themeMode: ThemeMode
  themeId: AppThemeId
  language: LanguageCode
  forceLTR: boolean
  accentFont: Font
  primaryFont: Font

  // Onboarding & navigation
  completedOnboarding: boolean
  showNavbar: boolean
  homeTab: NavTab
  navTabsOrder: NavTab[]
  navTabsVisibility: Record<NavTab, boolean>
  libraryTabsConfig: LibraryTabsConfig

  // Library display
  minAlbumLength: number
  quickScroll: boolean
  squareArtwork: boolean

  // Player UI
  nowPlayingDesign: NowPlayingDesign
  miniplayerGestures: boolean
  waveformSlider: boolean

  // Playback behavior
  dragClearPlayback: boolean
  playbackDelay: number
  continuePlaybackOnDismiss: boolean
  repeatOnSkip: boolean
  restoreLastPosition: boolean
  quickAddQueue: boolean
  quickFavorite: boolean
  queueAwareNext: boolean

  // Indexing
  rescanOnLaunch: boolean
  folderFilterConfig: FolderFilterConfig
  optimizedImageSave: boolean
  downsamplingProcessor: boolean

  // Integrations & updates
  appUpdateConfig: AppUpdateConfig
  indexerScanConfig: IndexerScanConfig
  indexerNotificationsEnabled: boolean
  autoBackupConfig: AutoBackupConfig

  // Audio engine
  crossfadeConfig: CrossfadeConfig
  audioPlaybackConfig: AudioPlaybackConfig

  // Filters & parsing
  trackDurationFilterConfig: TrackDurationFilterConfig
  countAsPlayedConfig: CountAsPlayedConfig
  splitMultipleValueConfig: SplitMultipleValueConfig

  // Logging
  loggingLevel: AppLogLevel
}
