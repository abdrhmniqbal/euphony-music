import type { Track as DataTrack } from "@/data/track/types"
import { updateColorsForImage } from "@/modules/player/colors"
import { usePlayerStore } from "@/modules/player/store"
import { playbackStore } from "@/stores/playback/store"
import { extractTrackId } from "@/stores/playback/utils"

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
  const { getTrack } = playbackStore.getState()
  const nextQueue = (
    await Promise.all(trackKeys.map((trackKey) => getTrack(trackKey)))
  )
    .map(toPlayerTrack)
    .filter((track): track is NonNullable<ReturnType<typeof toPlayerTrack>> =>
      track !== null
    )

  if (version !== queueSyncVersion || signature !== queueSignature) {
    return
  }

  queueTracks = nextQueue
  usePlayerStore.setState({ queue: nextQueue })
}

function syncPlayerStoreFromPlayback() {
  const state = playbackStore.getState()
  const nextQueueSignature = state.queue.join("|")

  if (nextQueueSignature !== queueSignature) {
    queueSignature = nextQueueSignature
    queueTracks = []
    void refreshQueueTracks(state.queue, nextQueueSignature)
  }

  usePlayerStore.setState({
    currentTrack: toPlayerTrack(state.activeTrack),
    isPlaying: state.isPlaying,
    currentTime: state.lastPosition,
    duration: state.activeTrack?.duration ?? 0,
    repeatMode: state.repeat === "no-repeat" ? "off"
      : state.repeat === "repeat" ? "queue"
      : "track",
    isShuffled: state.shuffle,
    queue: queueTracks,
    queueTrackIds: state.queue.map(extractTrackId),
    originalQueueTrackIds: state.orderSnapshot.map(extractTrackId),
    queueContext: null,
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
