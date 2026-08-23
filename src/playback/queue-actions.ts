import { addToEnd, add, moveTrack, removeIds } from "./actions/queue"
import { toggleShuffle } from "./actions/settings"

interface TrackLike {
  id: string
  title?: string
  name?: string
}

export function addToQueue(track: TrackLike) {
  addToEnd({ id: track.id, name: track.title ?? track.name ?? "" })
}

export function queueTrackNext(track: TrackLike) {
  add({ id: track.id, name: track.title ?? track.name ?? "" })
}

export function removeFromQueue(trackId: string) {
  return removeIds([trackId])
}

export function moveInQueue(fromIndex: number, toIndex: number) {
  moveTrack(fromIndex, toIndex)
}

export function toggleShuffleMode() {
  return toggleShuffle()
}
