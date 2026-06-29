/**
 * CQRS Read-Model Projector: Synchronizes the Drizzle KV `playbackStore` (source of truth)
 * into `usePlayerStore` (legacy UI read-model) to keep synchronous full-object getter helpers working.
 */
import type { Track as DataTrack } from "@/modules/tracks/types"
import { updateColorsForImage } from "@/modules/player/colors"
import { usePlayerStore } from "@/modules/player/store"
import { playbackStore } from "@/stores/playback/store"
import { extractTrackId } from "@/stores/playback/utils"
import { getSettingsState } from "@/modules/settings/store"
import {
  formatArtistsForDisplay,
  splitArtistsValue,
} from "@/modules/settings/split-multiple-values"

export function toPlayerTrack(track: DataTrack | undefined) {
  if (!track) return null

  let artistName = track.rawArtistName || track.artistName || undefined
  if (track.rawArtistName || track.artistName) {
    const rawArtist = track.rawArtistName || track.artistName || ""
    const splitConfig = getSettingsState().splitMultipleValueConfig
    const artistNames = splitArtistsValue(rawArtist, splitConfig)
    artistName = formatArtistsForDisplay(rawArtist, artistNames, splitConfig.artistSplitMode)
  }

  return {
    id: track.id,
    title: track.name,
    artist: artistName,
    artistId: track.artistName ?? undefined,
    album: track.albumName ?? undefined,
    albumId: track.albumId ?? undefined,
    duration: track.duration,
    uri: track.uri,
    image: track.artwork ?? undefined,
    isExternal: false,
    isDeleted: false,
    artistName: artistName,
    albumName: track.albumName,
    artwork: track.artwork,
    artists: track.artists,
    rawArtistName: track.rawArtistName,
  } as const
}

function syncPlayerStoreFromPlayback() {
  const state = playbackStore.getState()

  usePlayerStore.setState({
    currentTrack: toPlayerTrack(state.activeTrack),
    isPlaying: state.isPlaying,
    currentTime: state.lastPosition,
    duration: state.activeTrack?.duration ?? 0,
    repeatMode:
      state.repeat === "no-repeat" ? "off" : state.repeat === "repeat" ? "queue" : "track",
    isShuffled: state.shuffle,
    queue: [],
    queueKeys: state.queue,
    queueTrackIds: state.queue.map(extractTrackId),
    originalQueueTrackIds: state.orderSnapshot.map(extractTrackId),
    queueContext: state.queueContext,
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
