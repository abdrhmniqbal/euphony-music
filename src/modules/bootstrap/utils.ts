/**
 * Purpose: Bootstraps playback, settings, media permissions, startup resume behavior, and configured initial indexing.
 * Caller: App root providers during launch.
 * Dependencies: Track player service, media library service, Drizzle database, settings preloaders, indexer service, logging, playback controls, playback session service.
 * Main Functions: bootstrapApp()
 * Side Effects: Initializes native playback, reads local settings, may resume playback, requests media permissions, queries track count, and may start indexing.
 */

import {
  getMediaLibraryPermission,
  requestMediaLibraryPermission,
} from "@/core/storage/media-library-service"
import { logError, logInfo } from "@/modules/logging/service"
import { ensureAudioPlaybackConfigLoaded } from "@/modules/settings/audio-playback"
import { ensureAutoScanConfigLoaded } from "@/modules/settings/auto-scan"
import { resumeTrack } from "@/modules/player/controls"
import { restorePlaybackSession } from "@/modules/player/session-service"
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
    logInfo("Restoring playback session")
    await restorePlaybackSession()
    logInfo("Playback session restored")

    const audioPlaybackConfig = await ensureAudioPlaybackConfigLoaded()
    if (audioPlaybackConfig.resumeOnStart && getCurrentTrackState() && !getIsPlayingState()) {
      await resumeTrack()
    }
  } catch (error) {
    logError("Bootstrap app workflow failed", error)
    throw error
  }
}
