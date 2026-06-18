import { TrackPlayer, State } from "@/modules/player/utils"
import type { RepeatMode } from "@/modules/player/utils"
import { mapTrackPlayerRepeatMode, mapTrackPlayerTrackToTrack } from "../adapter"
import { getTracksState } from "../store"
import type { NativePlaybackStatusSnapshot, NativeQueue, ResolvedPlaybackSession } from "./types"

export function mapNativeQueueToTracks(nativeQueue: NativeQueue) {
  return nativeQueue
    .map((track) => mapTrackPlayerTrackToTrack(track, getTracksState()))
    .filter((track) => track.id && track.uri)
}

export async function readNativePlaybackSession(): Promise<ResolvedPlaybackSession | null> {
  const [nativeQueue, activeIndex, positionSeconds, playbackState, repeatMode] = await Promise.all([
    TrackPlayer.getQueue(),
    TrackPlayer.getCurrentTrack(),
    TrackPlayer.getPosition(),
    TrackPlayer.getState(),
    TrackPlayer.getRepeatMode(),
  ])

  const mappedQueue = mapNativeQueueToTracks(nativeQueue)
  if (mappedQueue.length === 0) {
    return null
  }

  const currentTrackId =
    activeIndex !== null && activeIndex >= 0 && activeIndex < mappedQueue.length
      ? (mappedQueue[activeIndex]?.id ?? null)
      : (mappedQueue[0]?.id ?? null)

  return {
    queue: mappedQueue,
    originalQueue: mappedQueue,
    immediateQueueTrackIds: [],
    currentTrackId,
    positionSeconds: Math.max(0, positionSeconds),
    repeatMode: mapTrackPlayerRepeatMode(repeatMode as RepeatMode),
    isPlaying: playbackState === State.Playing,
    isShuffled: false,
    queueContext: null,
  }
}

export async function readNativePlaybackStatus(): Promise<NativePlaybackStatusSnapshot | null> {
  const [activeTrack, positionSeconds, playbackState, repeatMode] = await Promise.all([
    TrackPlayer.getActiveTrack(),
    TrackPlayer.getPosition(),
    TrackPlayer.getState(),
    TrackPlayer.getRepeatMode(),
  ])

  return {
    currentTrack: activeTrack ? mapTrackPlayerTrackToTrack(activeTrack, getTracksState()) : null,
    currentTrackId: activeTrack?.id !== undefined ? String(activeTrack.id) : null,
    positionSeconds: Math.max(0, positionSeconds),
    repeatMode: mapTrackPlayerRepeatMode(repeatMode as RepeatMode),
    isPlaying: playbackState === State.Playing,
  }
}
