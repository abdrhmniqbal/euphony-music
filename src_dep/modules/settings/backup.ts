import { Directory, File, Paths } from "expo-file-system"

import { getSettingsState } from "@/modules/settings/store"
import { preferenceStore } from "@/stores/preference/store"

export async function backupPreferencesToFile(targetDirectoryUri?: string | null): Promise<string> {
  const settingsState = getSettingsState()
  const prefState = preferenceStore.getState()

  const backupData = {
    settings: {
      languageCode: settingsState.languageCode,
      indexerScanConfig: settingsState.indexerScanConfig,
      indexerNotificationsEnabled: settingsState.indexerNotificationsEnabled,
      appUpdateConfig: settingsState.appUpdateConfig,
      crossfadeConfig: settingsState.crossfadeConfig,
      audioPlaybackConfig: settingsState.audioPlaybackConfig,
      folderFilterConfig: settingsState.folderFilterConfig,
      loggingConfig: settingsState.loggingConfig,
      trackDurationFilterConfig: settingsState.trackDurationFilterConfig,
      countAsPlayedConfig: settingsState.countAsPlayedConfig,
      splitMultipleValueConfig: settingsState.splitMultipleValueConfig,
      themeConfig: settingsState.themeConfig,
      libraryTabsConfig: settingsState.libraryTabsConfig,
    },
    preferenceStore: prefState,
    version: 1,
    timestamp: new Date().toISOString(),
  }

  const fileName = `startune-backup-${Date.now()}.json`
  const file = targetDirectoryUri
    ? new Directory(targetDirectoryUri).createFile(fileName, "application/json")
    : new File(Paths.cache, fileName)

  if (!file.exists) {
    file.create({ intermediates: true })
  }

  await file.write(JSON.stringify(backupData, null, 2), { encoding: "utf8" })
  return file.uri
}

export async function restorePreferencesFromFile(uri: string): Promise<boolean> {
  try {
    const file = new File(uri)
    if (!file.exists) return false

    const content = await file.text()
    const data = JSON.parse(content)

    if (data.version !== 1 || !data.settings || !data.preferenceStore) {
      return false
    }

    const { setLibraryTabsConfig } = await import("@/modules/settings/library-tabs")
    const { commitFolderFilterConfig } = await import("@/modules/settings/folder-filters")
    const { setSplitMultipleValueConfig } = await import("@/modules/settings/split-multiple-values")
    const { setAppUpdateConfig } = await import("@/modules/settings/app-updates")
    const { setAudioPlaybackConfig } = await import("@/modules/settings/audio-playback")
    const { setAutoScanConfig } = await import("@/modules/settings/auto-scan")
    const { setCountAsPlayedConfig } = await import("@/modules/settings/count-as-played")
    const { setCrossfadeConfig } = await import("@/modules/settings/audio-crossfade")
    const { setIndexerNotificationsEnabled } =
      await import("@/modules/settings/indexer-notifications")
    const { setTrackDurationFilterConfig } =
      await import("@/modules/settings/track-duration-filter")
    const { setThemeConfig } = await import("@/modules/settings/theme")

    if (data.settings.libraryTabsConfig) await setLibraryTabsConfig(data.settings.libraryTabsConfig)
    if (data.settings.folderFilterConfig)
      await commitFolderFilterConfig(data.settings.folderFilterConfig)
    if (data.settings.splitMultipleValueConfig)
      await setSplitMultipleValueConfig(data.settings.splitMultipleValueConfig)
    if (data.settings.appUpdateConfig) await setAppUpdateConfig(data.settings.appUpdateConfig)
    if (data.settings.audioPlaybackConfig)
      await setAudioPlaybackConfig(data.settings.audioPlaybackConfig)
    if (data.settings.indexerScanConfig) await setAutoScanConfig(data.settings.indexerScanConfig)
    if (data.settings.countAsPlayedConfig)
      await setCountAsPlayedConfig(data.settings.countAsPlayedConfig)
    if (data.settings.crossfadeConfig) await setCrossfadeConfig(data.settings.crossfadeConfig)
    if (data.settings.indexerNotificationsEnabled !== undefined)
      await setIndexerNotificationsEnabled(data.settings.indexerNotificationsEnabled)
    if (data.settings.trackDurationFilterConfig)
      await setTrackDurationFilterConfig(data.settings.trackDurationFilterConfig)
    if (data.settings.themeConfig) await setThemeConfig(data.settings.themeConfig)

    preferenceStore.setState(data.preferenceStore)
    return true
  } catch {
    return false
  }
}
