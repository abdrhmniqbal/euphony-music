import KvStore from "expo-sqlite/kv-store"

import { PLAYBACK_STORE_PERSIST_KEY, playbackStore } from "@/playback/playback-store"
import type { DataTrack } from "@/domains/tracks/types"

interface PersistedPlaybackPayload {
  state?: {
    activeTrack?: DataTrack
    isPlaying?: boolean
  }
}

export async function readPersistedSnapshot(): Promise<{
  track: DataTrack | undefined
  isPlaying: boolean
}> {
  try {
    const raw = await KvStore.getItem(PLAYBACK_STORE_PERSIST_KEY)
    if (!raw) return { track: undefined, isPlaying: false }

    // SAFETY: the payload is only ever written by playbackStore's persist middleware in the documented { state, version } shape
    const payload = JSON.parse(raw) as PersistedPlaybackPayload
    return {
      track: payload.state?.activeTrack,
      isPlaying: payload.state?.isPlaying ?? false,
    }
  } catch {
    return { track: undefined, isPlaying: false }
  }
}

export async function hydratePlaybackStore(): Promise<void> {
  try {
    await playbackStore.persist.rehydrate()
  } catch {
    // cold context may fail to rehydrate; controls will fall back to persisted defaults
  }
}
