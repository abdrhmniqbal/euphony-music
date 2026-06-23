/**
 * Purpose: Bootstraps playback, settings, media permissions, startup resume behavior, and configured initial indexing.
 * Caller: App root providers during launch.
 * Dependencies: media library service, Drizzle database, settings preloaders, indexer service, logging, playback controls.
 * Main Functions: bootstrapApp()
 * Side Effects: Reads local settings, may resume playback, requests media permissions, queries track count, and may start indexing.
 */

import {
  getMediaLibraryPermission,
  requestMediaLibraryPermission,
} from "@/core/storage/media-library-service"
import { logError } from "@/modules/logging/service"
import { ensureAudioPlaybackConfigLoaded } from "@/modules/settings/audio-playback"
import { ensureAutoScanConfigLoaded } from "@/modules/settings/auto-scan"
import { resumeTrack } from "@/modules/player/controls"
import { getCurrentTrackState, getIsPlayingState } from "@/modules/player/store"
import { preferenceStore } from "@/stores/preference/store"

export async function canStartIndexingNow(options?: { initialScanOnly?: boolean }) {
  if (!preferenceStore.getState().completedOnboarding) {
    return false
  }

  const indexerScanConfig = await ensureAutoScanConfigLoaded()
  if (!indexerScanConfig.autoScanEnabled) {
    return false
  }

  if (options?.initialScanOnly && !indexerScanConfig.initialScanEnabled) {
    return false
  }

  const permission = await getMediaLibraryPermission()
  const status =
    permission.status === "undetermined" && permission.canAskAgain
      ? (await requestMediaLibraryPermission()).status
      : permission.status

  return status === "granted"
}

export async function bootstrapApp(): Promise<void> {
  try {
    const audioPlaybackConfig = await ensureAudioPlaybackConfigLoaded()
    if (audioPlaybackConfig.resumeOnStart && getCurrentTrackState() && !getIsPlayingState()) {
      await resumeTrack()
    }
  } catch (error) {
    logError("Bootstrap app workflow failed", error)
    throw error
  }
}
