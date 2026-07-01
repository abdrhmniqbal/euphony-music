import { Queue, PlaybackSettings } from "@/stores/playback/actions"

interface TrackLike {
  id: string
  title?: string
  name?: string
}

export async function addToQueue(track: TrackLike) {
  Queue.addToEnd({ id: track.id, name: track.title ?? track.name ?? "" })
}

export async function queueTrackNext(track: TrackLike) {
  Queue.add({ id: track.id, name: track.title ?? track.name ?? "" })
}

export async function removeFromQueue(trackId: string) {
  await Queue.removeIds([trackId])
}

export async function moveInQueue(fromIndex: number, toIndex: number) {
  Queue.moveTrack(fromIndex, toIndex)
}

export async function toggleShuffle() {
  await PlaybackSettings.toggleShuffle()
}


