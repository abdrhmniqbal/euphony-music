/**
 * Projects the Drizzle KV `playbackStore` (source of truth) into `usePlayerStore`
 * (legacy UI read-model) so synchronous full-object getter helpers keep working.
 */
import { toPlayerTrack } from "@/modules/player/track-projection"
import { updateColorsForImage } from "@/modules/player/colors"
import { usePlayerStore } from "@/modules/player/store"
import { playbackStore } from "@/stores/playback/store"
import { extractTrackId } from "@/stores/playback/utils"
import { getSettingsState } from "@/modules/settings/store"
import { maybeGetTrack } from "@/modules/tracks/repository"
import type { SplitMultipleValueConfig } from "@/modules/settings/types"
import type { Track as PlayerTrack } from "@/modules/player/types"

// Re-resolving the queue reads every track from the DB. Only do it when the queue
// itself changes, not on every playback tick (e.g. position updates).
let lastQueue: readonly string[] = []

function project() {
  const state = playbackStore.getState()
  const splitConfig = getSettingsState().splitMultipleValueConfig

  usePlayerStore.setState({
    currentTrack: toPlayerTrack(state.activeTrack, splitConfig),
    isPlaying: state.isPlaying,
    repeatMode:
      state.repeat === "no-repeat" ? "off" : state.repeat === "repeat" ? "queue" : "track",
    isShuffled: state.shuffle,
    queueTrackIds: state.queue.map(extractTrackId),
    originalQueueTrackIds: state.orderSnapshot.map(extractTrackId),
    queueContext: state.queueContext,
  })

  void updateColorsForImage(state.activeTrack?.artwork ?? undefined)

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
      return toPlayerTrack(track, splitConfig)
    })
  )
  usePlayerStore.setState({ tracks: tracks.filter((t): t is PlayerTrack => t !== null) })
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
