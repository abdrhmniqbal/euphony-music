import { updateColorsForImage } from "@/modules/player/colors"
import { areStringArraysEqual, areTracksPresentationEqual } from "../session-comparison"
import { usePlayerStore } from "../store"
import type { ResolvedPlaybackSession } from "./types"
import { PLAYBACK_POSITION_EPSILON } from "./types"

export function applyResolvedPlaybackSession(session: ResolvedPlaybackSession) {
  const queueTrackIds = session.queue.map((track) => track.id)
  const originalQueueTrackIds = session.originalQueue.map((track) => track.id)
  const currentTrack =
    (session.currentTrackId
      ? session.queue.find((track) => track.id === session.currentTrackId)
      : null) ||
    session.queue[0] ||
    null
  const nextOriginalQueueTrackIds =
    originalQueueTrackIds.length > 0 ? originalQueueTrackIds : queueTrackIds
  const nextDuration = currentTrack?.duration || 0
  const previousState = usePlayerStore.getState()
  const updates: Partial<ReturnType<typeof usePlayerStore.getState>> = {}
  const shouldUpdateCurrentTrack = !areTracksPresentationEqual(
    previousState.currentTrack,
    currentTrack
  )

  if (!areStringArraysEqual(previousState.queueTrackIds, queueTrackIds)) {
    updates.queue = session.queue
    updates.queueTrackIds = queueTrackIds
  }

  if (!areStringArraysEqual(previousState.originalQueueTrackIds, nextOriginalQueueTrackIds)) {
    updates.originalQueue = session.originalQueue
    updates.originalQueueTrackIds = nextOriginalQueueTrackIds
  }

  if (!areStringArraysEqual(previousState.immediateQueueTrackIds, session.immediateQueueTrackIds)) {
    updates.immediateQueueTrackIds = session.immediateQueueTrackIds
  }

  if (previousState.isShuffled !== session.isShuffled) {
    updates.isShuffled = session.isShuffled
  }

  if (previousState.repeatMode !== session.repeatMode) {
    updates.repeatMode = session.repeatMode
  }

  if (previousState.isPlaying !== session.isPlaying) {
    updates.isPlaying = session.isPlaying
  }

  if (
    previousState.queueContext?.type !== session.queueContext?.type ||
    previousState.queueContext?.title !== session.queueContext?.title
  ) {
    updates.queueContext = session.queueContext
  }

  if (Math.abs(previousState.currentTime - session.positionSeconds) >= PLAYBACK_POSITION_EPSILON) {
    updates.currentTime = session.positionSeconds
  }

  if (previousState.duration !== nextDuration) {
    updates.duration = nextDuration
  }

  if (shouldUpdateCurrentTrack) {
    updates.currentTrack = currentTrack
  }

  if (Object.keys(updates).length === 0) {
    return
  }

  usePlayerStore.setState(updates)

  if (shouldUpdateCurrentTrack) {
    void updateColorsForImage(currentTrack?.image)
  }
}
