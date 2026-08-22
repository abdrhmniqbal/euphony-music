import { logError, logInfo, logWarn } from "@/core/log/service"

import type { PlaybackQueueContext, PlayerTrack } from "./types"
import { playbackStore } from "./playback-store"
import { getPreferenceState } from "@/core/preferences/store"
import { playFromTracks, setupPlaybackCore } from "./playback-core"
import { getIsShuffledState, getTracksState } from "./player-store"
import { buildPlaybackQueue, inferQueueContext } from "./queue-context"

let isPlayerReady = false
let setupPlayerPromise: Promise<void> | null = null

export async function setupPlayer() {
  if (isPlayerReady) {
    return
  }

  if (setupPlayerPromise) {
    return setupPlayerPromise
  }

  setupPlayerPromise = (async () => {
    try {
      logInfo("Setting up audio-browser playback core")
      await setupPlaybackCore()

      const { restoreLastPosition } = getPreferenceState()
      const { activeKey } = playbackStore.getState()
      if (restoreLastPosition) {
        playbackStore.setState({
          _hasRestoredPosition: false,
          _restoredTrackKey: activeKey,
        })
      } else {
        playbackStore.setState({
          _hasRestoredPosition: true,
          _restoredTrackKey: undefined,
          lastPosition: 0,
        })
      }

      isPlayerReady = true
      logInfo("Playback core setup completed")
    } catch (error: unknown) {
      logError("AudioBrowser playback core setup failed", error)
    } finally {
      setupPlayerPromise = null
    }
  })()

  return setupPlayerPromise
}

export async function playTrack(
  track: PlayerTrack,
  playlistTracks?: PlayerTrack[],
  queueContext?: PlaybackQueueContext
) {
  if (!isPlayerReady) {
    logInfo("Player not ready on playTrack call, initializing now", {
      trackId: track.id,
    })
    await setupPlayer()
  }

  if (!isPlayerReady) {
    logWarn("Ignored playTrack call because player setup failed", {
      trackId: track.id,
    })
    return false
  }

  try {
    logInfo("Playing track", {
      trackId: track.id,
      queueLength: playlistTracks?.length ?? getTracksState().length,
    })

    const wasShuffled = track.isExternal ? false : getIsShuffledState()
    const tracks = playlistTracks || getTracksState()
    const resolvedQueueContext = inferQueueContext(track, tracks, queueContext)
    const { queue: linearQueue } = buildPlaybackQueue(tracks, track.id)

    const started = await playFromTracks({
      track,
      tracks: linearQueue,
      context: resolvedQueueContext,
      shuffle: wasShuffled,
    })
    if (!started) {
      return false
    }
    if (!track.isExternal) {
      const { handleTrackActivated } = await import("./activity")
      await handleTrackActivated(track)
    }
    return true
  } catch (error) {
    logError("Failed to play track", error, { trackId: track.id })
    return false
  }
}
