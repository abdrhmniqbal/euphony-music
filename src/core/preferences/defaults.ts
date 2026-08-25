import { isDevBuild, getCurrentAppVersion } from "@/core/config/app-version"
import { isPreviewReleaseVersion } from "@/core/config/version-compare"
import { DEFAULT_LANGUAGE_CODE } from "@/core/localization/types"

import { getDefaultLibraryTabsConfig } from "./library-tabs"
import type {
  AppUpdateConfig,
  AudioPlaybackConfig,
  CountAsPlayedConfig,
  CrossfadeConfig,
  FolderFilterConfig,
  IndexerScanConfig,
  PreferenceState,
  SplitMultipleValueConfig,
  TrackDurationFilterConfig,
} from "./types"

const DEFAULT_APP_UPDATE_CONFIG: AppUpdateConfig = {
  notificationsEnabled: true,
  includePrereleases: isPreviewReleaseVersion(getCurrentAppVersion()),
}

export function getDefaultAppUpdateConfig(): AppUpdateConfig {
  return DEFAULT_APP_UPDATE_CONFIG
}

const DEFAULT_INDEXER_SCAN_CONFIG: IndexerScanConfig = {
  autoScanEnabled: true,
  rescanImmediatelyEnabled: false,
  initialScanEnabled: true,
}

export function getDefaultIndexerScanConfig(): IndexerScanConfig {
  return DEFAULT_INDEXER_SCAN_CONFIG
}

export const DEFAULT_CROSSFADE_CONFIG: CrossfadeConfig = {
  isEnabled: false,
  durationSeconds: 5,
}

export const DEFAULT_AUDIO_PLAYBACK_CONFIG: AudioPlaybackConfig = {
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

export const DEFAULT_FOLDER_FILTER_CONFIG: FolderFilterConfig = {
  whitelist: [],
  blacklist: [],
}

export const DEFAULT_TRACK_DURATION_FILTER_CONFIG: TrackDurationFilterConfig = {
  mode: "off",
  customMinimumSeconds: 180,
}

export const DEFAULT_COUNT_AS_PLAYED_CONFIG: CountAsPlayedConfig = {
  minimumPlayedPercent: 15,
  minimumSeconds: 15,
}

export const DEFAULT_SPLIT_MULTIPLE_VALUE_CONFIG: SplitMultipleValueConfig = {
  artistSplitMode: "split",
  artistCharDelimiters: ["/", ";", ",", "+", "&"],
  artistWordDelimiters: [
    "featuring",
    "feat.",
    "feat",
    "ft.",
    "ft",
    "vs.",
    "versus",
    "with",
    "prod.",
    "prod",
  ],
  extractArtistFromTitle: false,
  unsplitArtists: [],
  genreSplitSymbols: [";", "/", ","],
}

export function getDefaultPreferenceState(): PreferenceState {
  return {
    _hasHydrated: false,

    themeMode: "system",
    themeId: "default",
    language: DEFAULT_LANGUAGE_CODE,
    forceLTR: false,
    accentFont: "NType",
    primaryFont: "Roboto",

    completedOnboarding: false,
    showNavbar: true,
    homeTab: "home",
    navTabsOrder: ["home", "folder", "playlist", "track", "album", "artist", "genre"],
    navTabsVisibility: {
      album: true,
      artist: true,
      folder: true,
      genre: true,
      home: true,
      playlist: true,
      track: true,
    },
    libraryTabsConfig: getDefaultLibraryTabsConfig(),

    minAlbumLength: 0,
    quickScroll: true,
    squareArtwork: true,
    maxMixItems: 25,

    nowPlayingDesign: "vinyl",
    miniplayerGestures: false,
    waveformSlider: false,

    dragClearPlayback: false,
    playbackDelay: 0,
    continuePlaybackOnDismiss: true,
    repeatOnSkip: false,
    restoreLastPosition: true,
    quickAddQueue: false,
    quickFavorite: false,
    queueAwareNext: false,

    rescanOnLaunch: true,
    folderFilterConfig: DEFAULT_FOLDER_FILTER_CONFIG,
    optimizedImageSave: true,
    downsamplingProcessor: true,

    appUpdateConfig: DEFAULT_APP_UPDATE_CONFIG,
    indexerScanConfig: DEFAULT_INDEXER_SCAN_CONFIG,
    indexerNotificationsEnabled: true,
    autoBackupConfig: {
      enabled: false,
      intervalHours: 24,
      lastBackupAt: 0,
      targetDirectoryUri: null,
    },

    crossfadeConfig: DEFAULT_CROSSFADE_CONFIG,
    audioPlaybackConfig: DEFAULT_AUDIO_PLAYBACK_CONFIG,

    trackDurationFilterConfig: DEFAULT_TRACK_DURATION_FILTER_CONFIG,
    countAsPlayedConfig: DEFAULT_COUNT_AS_PLAYED_CONFIG,
    splitMultipleValueConfig: DEFAULT_SPLIT_MULTIPLE_VALUE_CONFIG,

    loggingLevel: isDevBuild() ? "extra" : "minimal",
  }
}
