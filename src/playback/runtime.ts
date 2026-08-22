import { logError, logInfo } from "@/core/log/service"

import { registerPlaybackListeners } from "./listeners"
import { restoreCurrentTrackForStartup } from "./actions/controls"
import { setupPlayer } from "./service"
import { playbackStore } from "./playback-store"

export async function startPlaybackRuntime() {
  try {
    await setupPlayer()
    registerPlaybackListeners()

    await playbackStore.getState().restoreActiveTrack()
    await restoreCurrentTrackForStartup()

    logInfo("Playback runtime ready")
  } catch (error) {
    logError("Failed to start playback runtime", error)
  }
}
