/**
 * Purpose: Initializes the AudioBrowser playback core during app bootstrap.
 * Caller: Bootstrap startup utilities.
 * Dependencies: player service and logging service.
 * Main Functions: registerPlaybackService(), initializeTrackPlayer()
 * Side Effects: Starts native audio playback service listeners.
 */

import { setupPlayer } from "@/modules/player/service"
import { logError, logInfo } from "@/modules/logging/service"

let isPlaybackServiceRegistered = false

export function registerPlaybackService(): void {
  if (isPlaybackServiceRegistered) {
    logInfo("Playback service registration skipped because it is already registered")
    return
  }

  logInfo("AudioBrowser playback service uses in-process event registration")
  isPlaybackServiceRegistered = true
}

export async function initializeTrackPlayer(): Promise<void> {
  try {
    logInfo("Starting AudioBrowser setup")
    await setupPlayer()
    logInfo("AudioBrowser setup completed")
  } catch (error) {
    logError("AudioBrowser setup failed", error)
    throw error
  }
}
