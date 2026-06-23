import type { Track as DataTrack } from "@/modules/tracks/types"
import { updateColorsForImage } from "@/modules/player/colors"
import { logError } from "@/modules/logging/service"
import { usePlayerStore } from "@/modules/player/store"
import { getTracksByIds } from "@/modules/tracks/repository"
import { playbackStore } from "@/stores/playback/store"
import { extractTrackId } from "@/stores/playback/utils"

import type { PlayerQueueContext } from "@/modules/player/types"

function toPlayerTrack(track: DataTrack | undefined) {
  if (!track) return null
  return {
    id: track.id,
    title: track.name,
    artist: track.artistName ?? undefined,
    artistId: track.artistName ?? undefined,
    album: track.albumName ?? undefined,
    albumId: track.albumId ?? undefined,
    duration: track.duration,
    uri: track.uri,
    image: track.artwork ?? undefined,
    isExternal: false,
    isDeleted: false,
    artistName: track.artistName,
    albumName: track.albumName,
    artwork: track.artwork,
    artists: track.artists,
  } as const
}

let queueSignature = ""
let queueTracks: Array<NonNullable<ReturnType<typeof toPlayerTrack>>> = []
let queueSyncVersion = 0

async function refreshQueueTracks(trackKeys: string[], signature: string) {
  const version = ++queueSyncVersion

  try {
    const trackIds = trackKeys.map(extractTrackId)
    const resolvedTracks = await getTracksByIds(trackIds)
    const resolvedTrackMap = new Map(resolvedTracks.map((track) => [track.id, track]))
    const previousTrackMap = new Map(queueTracks.map((track) => [track.id, track]))
    const activeTrack = playbackStore.getState().activeTrack

    const nextQueue = trackIds
      .map((trackId) => {
        const resolvedTrack = resolvedTrackMap.get(trackId)
        if (resolvedTrack) {
          return toPlayerTrack(resolvedTrack)
        }

        if (activeTrack?.id === trackId) {
          return toPlayerTrack(activeTrack)
        }

        return previousTrackMap.get(trackId) ?? null
      })
      .filter((track): track is NonNullable<ReturnType<typeof toPlayerTrack>> => track !== null)

    if (version !== queueSyncVersion || signature !== queueSignature) {
      return
    }

    queueTracks = nextQueue
    usePlayerStore.setState({ queue: nextQueue })
  } catch (error) {
    logError("Failed to refresh playback queue tracks", error, {
      queueLength: trackKeys.length,
    })
  }
}

function syncPlayerStoreFromPlayback() {
  const state = playbackStore.getState()
  const nextQueueSignature = state.queue.join("|")

  if (nextQueueSignature !== queueSignature) {
    queueSignature = nextQueueSignature
    void refreshQueueTracks(state.queue, nextQueueSignature)
  }

  let queueContext: PlayerQueueContext | null = null
  if (state.playingFrom) {
    queueContext = {
      type: state.playingFrom.type as PlayerQueueContext["type"],
      title: state.playingFromName || "",
    }
  }

  usePlayerStore.setState({
    currentTrack: toPlayerTrack(state.activeTrack),
    isPlaying: state.isPlaying,
    currentTime: state.lastPosition,
    duration: state.activeTrack?.duration ?? 0,
    repeatMode:
      state.repeat === "no-repeat" ? "off" : state.repeat === "repeat" ? "queue" : "track",
    isShuffled: state.shuffle,
    queue: queueTracks,
    queueTrackIds: state.queue.map(extractTrackId),
    originalQueueTrackIds: state.orderSnapshot.map(extractTrackId),
    queueContext,
  })

  void updateColorsForImage(state.activeTrack?.artwork ?? undefined)
}

let isSubscribed = false

export function subscribePlaybackStoreToPlayerStore() {
  if (isSubscribed) return
  isSubscribed = true

  syncPlayerStoreFromPlayback()

  playbackStore.subscribe(() => {
    syncPlayerStoreFromPlayback()
  })
}
