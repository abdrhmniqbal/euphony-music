/**
 * CQRS Read-Model Projector: Synchronizes the Drizzle KV `playbackStore` (source of truth)
 * into `usePlayerStore` (legacy UI read-model) to keep synchronous full-object getter helpers working.
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

function syncPlayerStoreFromPlayback() {
  const state = playbackStore.getState()
  const splitConfig = getSettingsState().splitMultipleValueConfig

  usePlayerStore.setState({
    currentTrack: toPlayerTrack(state.activeTrack, splitConfig),
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

  // Resolve the full queue into the legacy `tracks` field so the queue UI (and
  // other consumers of usePlayerTracks) read in-memory data instead of issuing
  // a per-render DB query per item. Fire-and-forget: the synchronous setState
  // above already unblocks rendering with queueKeys.
  void resolveQueueTracks(state.queue, splitConfig)
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
  if (isSubscribed) return
  isSubscribed = true

  syncPlayerStoreFromPlayback()

  playbackStore.subscribe(() => {
    syncPlayerStoreFromPlayback()
  })
}
