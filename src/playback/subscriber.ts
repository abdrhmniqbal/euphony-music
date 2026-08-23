import { getPreferenceState } from "@/core/preferences/store"
import type { SplitMultipleValueConfig } from "@/core/preferences/types"
import { maybeGetTrack } from "@/domains/tracks/repository"

import { extractTrackId, playbackStore } from "./playback-store"
import { playerStore } from "./player-store"
import { toPlayerTrack } from "./player-track"

// Re-resolving the queue reads every track from the DB. Only do it when the
// queue itself changes, not on every playback tick (e.g. position updates).
let lastQueue: readonly string[] = []

function project() {
  const state = playbackStore.getState()
  const splitConfig = getPreferenceState().splitMultipleValueConfig

  const currentTrack = toPlayerTrack(state.activeTrack, splitConfig)

  playerStore.setState({
    currentTrack,
    isPlaying: state.isPlaying,
    repeatMode:
      state.repeat === "no-repeat" ? "off" : state.repeat === "repeat" ? "queue" : "track",
    isShuffled: state.shuffle,
    queueTrackIds: state.queue.map(extractTrackId),
    originalQueueTrackIds: state.orderSnapshot.map(extractTrackId),
    queueContext: state.queueContext,
  })

  if (state.queue !== lastQueue) {
    lastQueue = state.queue
    void resolveQueueTracks(state.queue, splitConfig)
  }
}

async function resolveQueueTracks(
  queueKeys: string[],
  splitConfig: SplitMultipleValueConfig
): Promise<void> {
  const tracks = await Promise.all(
    queueKeys.map(async (key) => {
      const track = await maybeGetTrack(extractTrackId(key))
      return toPlayerTrack(track ?? undefined, splitConfig)
    })
  )
  playerStore.setState({
    tracks: tracks.filter((t): t is NonNullable<typeof t> => t !== null),
  })
}

let isSubscribed = false

export function subscribePlaybackStoreToPlayerStore() {
  if (isSubscribed) {
    return
  }
  isSubscribed = true

  project()
  playbackStore.subscribe(project)
}
