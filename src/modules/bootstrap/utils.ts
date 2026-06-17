/**
 * Purpose: Bootstraps playback, settings, media permissions, startup resume behavior, and configured initial indexing.
 * Caller: App root providers during launch.
 * Dependencies: Track player service, media library service, Drizzle database, settings preloaders, indexer service, logging, playback controls, playback session service.
 * Main Functions: bootstrapApp()
 * Side Effects: Initializes native playback, reads local settings, may resume playback, requests media permissions, queries track count, and may start indexing.
 */

import { count } from "drizzle-orm"

import {
  initializeTrackPlayer,
  registerPlaybackService,
} from "@/core/audio/track-player.service"
import {
  getMediaLibraryPermission,
  requestMediaLibraryPermission,
} from "@/core/storage/media-library.service"
import { db } from "@/db/client"
import { tracks } from "@/db/schema"
import { startIndexing } from "@/modules/indexer/service"
import { measurePerfTrace } from "@/modules/logging/perf-trace"
import { logError, logInfo } from "@/modules/logging/service"
import { ensureLoggingConfigLoaded } from "@/modules/logging/store"
import { resumeTrack } from "@/modules/player/controls"
import { subscribePlaybackStoreToPlayerStore } from "@/modules/player/playback-subscriber"
import { restorePlaybackSession } from "@/modules/player/session.service"
import {
  getCurrentTrackState,
  getIsPlayingState,
} from "@/modules/player/store"
import { ensureAppUpdateConfigLoaded } from "@/modules/settings/app-updates"
import { ensureCrossfadeConfigLoaded } from "@/modules/settings/audio-crossfade"
import { ensureAudioPlaybackConfigLoaded } from "@/modules/settings/audio-playback"
import { ensureAutoScanConfigLoaded } from "@/modules/settings/auto-scan"
import { ensureCountAsPlayedConfigLoaded } from "@/modules/settings/count-as-played"
import { ensureFolderFilterConfigLoaded } from "@/modules/settings/folder-filters"
import { ensureIndexerNotificationsConfigLoaded } from "@/modules/settings/indexer-notifications"
import { ensureSplitMultipleValueConfigLoaded } from "@/modules/settings/split-multiple-values"
import { ensureTrackDurationFilterConfigLoaded } from "@/modules/settings/track-duration-filter"

async function preloadLocalSettings() {
  logInfo("Preloading local settings")
  await measurePerfTrace("bootstrap.preloadLocalSettings", async () => {
    await Promise.all([
      ensureAutoScanConfigLoaded(),
      ensureAudioPlaybackConfigLoaded(),
      ensureAppUpdateConfigLoaded(),
      ensureCrossfadeConfigLoaded(),
      ensureCountAsPlayedConfigLoaded(),
      ensureFolderFilterConfigLoaded(),
      ensureIndexerNotificationsConfigLoaded(),
      ensureTrackDurationFilterConfigLoaded(),
      ensureSplitMultipleValueConfigLoaded(),
      ensureLoggingConfigLoaded(),
    ])
  })
}

export async function bootstrapApp(): Promise<void> {
  try {
    logInfo("Registering playback service")
    registerPlaybackService()
    logInfo("Playback service registered")

    logInfo("Initializing track player")
    await measurePerfTrace("bootstrap.initializeTrackPlayer", async () => {
      await initializeTrackPlayer()
    })
    logInfo("Track player initialized")

    subscribePlaybackStoreToPlayerStore()

    await preloadLocalSettings()

    logInfo("Restoring playback session")
    await measurePerfTrace("bootstrap.restorePlaybackSession", async () => {
      await restorePlaybackSession()
    })
    logInfo("Playback session restored")

    const audioPlaybackConfig = await ensureAudioPlaybackConfigLoaded()
    if (
      audioPlaybackConfig.resumeOnStart &&
      getCurrentTrackState() &&
      !getIsPlayingState()
    ) {
      await resumeTrack()
    }

    logInfo("Resolving media library permission during bootstrap")
    const permission = await getMediaLibraryPermission()
    const status =
      permission.status === "undetermined" && permission.canAskAgain
        ? (await requestMediaLibraryPermission()).status
        : permission.status
    logInfo("Media library permission resolved during bootstrap", { status })
    if (status !== "granted") {
      logInfo("Skipping bootstrap index run due to media permission status", {
        status,
      })
      return
    }

    const indexerScanConfig = await ensureAutoScanConfigLoaded()
    if (!indexerScanConfig.autoScanEnabled) {
      logInfo("Initial scan skipped because auto-scan is disabled")
      return
    }

    if (!indexerScanConfig.initialScanEnabled) {
      logInfo("Initial scan disabled during bootstrap")
      return
    }

    logInfo("Loading track count for bootstrap index decision")
    const result = await db.select({ value: count() }).from(tracks)

    const trackCount = result[0]?.value ?? 0
    const isFreshDatabase = trackCount === 0
    logInfo("Scheduling bootstrap index run", {
      trackCount,
      isFreshDatabase,
    })

    void startIndexing(isFreshDatabase, isFreshDatabase)
  } catch (error) {
    logError("Bootstrap app workflow failed", error)
    throw error
  }
}
