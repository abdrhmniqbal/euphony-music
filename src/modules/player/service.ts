/**
 * Purpose: Sets up AudioBrowser playback, plays indexed tracks, indexes external intent files on demand, and stores queue source context when playback starts.
 * Caller: track rows, player controls, queue recovery flows, bootstrap playback setup, external audio intent handler.
 * Dependencies: AudioBrowser playback core, player store, player activity service, crossfade transition service, metadata/artwork helpers, file URI utilities, logging service.
 * Main Functions: setupPlayer(), playTrack(), playExternalFileUri()
 * Side Effects: Initializes native playback, reads external file metadata/artwork, writes newly opened external files to the library database, resets playback context and volume transitions, starts playback.
 */

import { logError, logInfo, logWarn } from "@/modules/logging/service"
import {
  buildExternalTrack,
  findIndexedTrackForExternalUri,
  indexExternalFileTrack,
} from "@/modules/indexer/external-file-import"
import { handleTrackActivated } from "@/modules/player/activity"
import { resetCrossfadeVolume } from "@/modules/player/crossfade"
import { playFromTracks, setupPlaybackCore } from "@/modules/player/playback-core"
import { beginPlayerQueueReplacement, endPlayerQueueReplacement } from "@/modules/player/runtime"
import { allTracksShareValue, buildPlaybackQueue, inferQueueContext } from "./queue-context"
import {
  EXTERNAL_TRACK_ID_PREFIX,
  type PlayerQueueContext,
  type Track,
} from "@/modules/player/types"
import type { Track as DataTrack } from "@/modules/tracks/types"
import { playbackStore } from "@/stores/playback/store"
import { preferenceStore } from "@/stores/preference/store"
import { resolvePlayableFileUri } from "@/utils/file-path"
import { updateNowPlaying } from "react-native-audio-browser"
import { getExternalTrackTitle, normalizeExternalIntentUri } from "./external-track-utils"
import { getIsShuffledState, getTracksState, setTracksState } from "./store"

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

      const { restoreLastPosition } = preferenceStore.getState()
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
      if (error instanceof Error && error.message.includes("already been initialized")) {
        isPlayerReady = true
        logInfo("AudioBrowser playback core already initialized")
        return
      }

      logError("AudioBrowser playback core setup failed", error)
    } finally {
      setupPlayerPromise = null
    }
  })()

  return setupPlayerPromise
}

export async function playTrack(
  track: Track,
  playlistTracks?: Track[],
  queueContext?: PlayerQueueContext
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

  beginPlayerQueueReplacement()

  try {
    logInfo("Playing track", {
      trackId: track.id,
      queueLength: playlistTracks?.length ?? getTracksState().length,
    })

    const wasShuffled = track.isExternal ? false : getIsShuffledState()
    const tracks = playlistTracks || getTracksState()
    const resolvedQueueContext = inferQueueContext(track, tracks, queueContext)
    const { queue: linearQueue } = buildPlaybackQueue(tracks, track.id)

    await resetCrossfadeVolume()
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
      await handleTrackActivated(track)
    }
    return true
  } catch (error) {
    logError("Failed to play track", error, { trackId: track.id })
    return false
  } finally {
    endPlayerQueueReplacement()
  }
}

export async function playExternalFileUri(uri: string) {
  const externalUri = normalizeExternalIntentUri(uri)
  if (!externalUri) {
    return false
  }

  if (!isPlayerReady) {
    await setupPlayer()
  }

  if (!isPlayerReady) {
    logWarn("Ignored external file playback because player is not ready", {
      uri: externalUri,
    })
    return false
  }

  const resolvedUri = await resolvePlayableFileUri(externalUri)
  const indexedTrack = await findIndexedTrackForExternalUri(externalUri, resolvedUri)

  if (indexedTrack) {
    logInfo("Playing indexed track matched from external file intent", {
      trackId: indexedTrack.id,
    })
    return await playTrack(indexedTrack, [indexedTrack], {
      type: "external",
      title: indexedTrack.title,
    })
  }

  // Play immediately with a fallback track
  const fallbackTitle = getExternalTrackTitle(externalUri)
  const fallbackTrack: Track = {
    id: `${EXTERNAL_TRACK_ID_PREFIX}${Date.now()}:${resolvedUri || externalUri}`,
    title: fallbackTitle,
    duration: 0,
    uri: resolvedUri || externalUri,
    isExternal: true,
  }

  logInfo("Dispatching immediate external playback with fallback track", {
    uri: externalUri,
  })

  const playPromise = playTrack(fallbackTrack, [fallbackTrack], {
    type: "external",
    title: fallbackTrack.title,
  })

  // Index and update metadata in the background
  void (async () => {
    try {
      let indexedExternalTrack: Track
      try {
        indexedExternalTrack = await indexExternalFileTrack(externalUri, resolvedUri)
      } catch (err) {
        logWarn("Failed to fully index external file, using partial metadata", err)
        indexedExternalTrack = await buildExternalTrack(externalUri, resolvedUri)
      }

      const currentTracks = getTracksState()
      const updatedTracks = currentTracks.map((t) => {
        if (t.uri === fallbackTrack.uri || t.id === fallbackTrack.id) {
          return indexedExternalTrack
        }
        return t
      })

      if (!updatedTracks.some((t) => t.id === indexedExternalTrack.id)) {
        updatedTracks.push(indexedExternalTrack)
      }
      setTracksState(updatedTracks)

      const activeTrack = playbackStore.getState().activeTrack
      if (
        activeTrack &&
        (activeTrack.id === fallbackTrack.id || activeTrack.uri === fallbackTrack.uri)
      ) {
        const updatedActiveTrack: DataTrack = {
          id: indexedExternalTrack.id,
          name: indexedExternalTrack.title,
          artwork: indexedExternalTrack.image ?? indexedExternalTrack.albumArtwork ?? null,
          artists: indexedExternalTrack.artist ? [indexedExternalTrack.artist] : null,
          albumName: indexedExternalTrack.album ?? null,
          uri: indexedExternalTrack.uri,
          duration: indexedExternalTrack.duration ?? 0,
          artistName: indexedExternalTrack.artist ?? null,
          discoverTime: null,
          modificationTime: null,
          rawArtistName: indexedExternalTrack.artist ?? null,
          albumId: indexedExternalTrack.albumId ?? null,
          parentFolder: null,
        }

        playbackStore.setState({ activeTrack: updatedActiveTrack })
        updateNowPlaying({
          title: indexedExternalTrack.title,
          artist: indexedExternalTrack.artist,
        })
      }
    } catch (error) {
      logError("Background external track processing failed", error)
    }
  })()

  return await playPromise
}
