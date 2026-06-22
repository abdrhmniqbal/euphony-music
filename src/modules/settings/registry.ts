import { ensureAppUpdateConfigLoaded } from "@/modules/settings/app-updates"
import { ensureAudioPlaybackConfigLoaded } from "@/modules/settings/audio-playback"
import { ensureAutoBackupConfigLoaded } from "@/modules/settings/auto-backup"
import { ensureAutoScanConfigLoaded } from "@/modules/settings/auto-scan"
import { ensureCountAsPlayedConfigLoaded } from "@/modules/settings/count-as-played"
import { ensureCrossfadeConfigLoaded } from "@/modules/settings/audio-crossfade"
import { ensureFolderFilterConfigLoaded } from "@/modules/settings/folder-filters"
import { ensureIndexerNotificationsConfigLoaded } from "@/modules/settings/indexer-notifications"
import { ensureLoggingConfigLoaded } from "@/modules/logging/store"
import { ensureLibraryTabsConfigLoaded } from "@/modules/settings/library-tabs"
import { ensureSplitMultipleValueConfigLoaded } from "@/modules/settings/split-multiple-values"
import { ensureThemeConfigLoaded } from "@/modules/settings/theme"
import { ensureTrackDurationFilterConfigLoaded } from "@/modules/settings/track-duration-filter"

type SettingHydrationDescriptor = {
  key: string
  ensureLoaded: () => Promise<unknown>
}

const SETTING_HYDRATION_REGISTRY: SettingHydrationDescriptor[] = [
  { key: "autoScanConfig", ensureLoaded: ensureAutoScanConfigLoaded },
  { key: "audioPlaybackConfig", ensureLoaded: ensureAudioPlaybackConfigLoaded },
  { key: "appUpdateConfig", ensureLoaded: ensureAppUpdateConfigLoaded },
  { key: "countAsPlayedConfig", ensureLoaded: ensureCountAsPlayedConfigLoaded },
  { key: "crossfadeConfig", ensureLoaded: ensureCrossfadeConfigLoaded },
  { key: "folderFilterConfig", ensureLoaded: ensureFolderFilterConfigLoaded },
  { key: "indexerNotificationsEnabled", ensureLoaded: ensureIndexerNotificationsConfigLoaded },
  { key: "loggingConfig", ensureLoaded: ensureLoggingConfigLoaded },
  { key: "libraryTabsConfig", ensureLoaded: ensureLibraryTabsConfigLoaded },
  { key: "splitMultipleValueConfig", ensureLoaded: ensureSplitMultipleValueConfigLoaded },
  { key: "themeConfig", ensureLoaded: ensureThemeConfigLoaded },
  { key: "trackDurationFilterConfig", ensureLoaded: ensureTrackDurationFilterConfigLoaded },
  { key: "autoBackupConfig", ensureLoaded: ensureAutoBackupConfigLoaded },
]

export function getRegisteredSettings() {
  return SETTING_HYDRATION_REGISTRY
}

export async function preloadRegisteredSettings() {
  await Promise.all(SETTING_HYDRATION_REGISTRY.map((descriptor) => descriptor.ensureLoaded()))
}
