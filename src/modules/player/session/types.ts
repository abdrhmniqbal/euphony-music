import type { PlayerQueueContext, RepeatModeType, Track } from "@/modules/player/types"
import type { PersistedPlaybackCursorSnapshot } from "@/modules/player/session.repository"
import type { TrackPlayer } from "@/modules/player/utils"

export const MIN_SESSION_SAVE_INTERVAL_MS = 2000
export const MAX_TRACKMAP_SIZE = 300
export const TRACKMAP_ACTIVE_WINDOW = 120
export const PLAYBACK_POSITION_EPSILON = 0.01

export type NativeQueue = Awaited<ReturnType<typeof TrackPlayer.getQueue>>
export type NativeTrack = Awaited<ReturnType<typeof TrackPlayer.getActiveTrack>>

export interface ResolvedPlaybackSession {
  currentTrackId: string | null
  immediateQueueTrackIds: string[]
  isPlaying: boolean
  isShuffled: boolean
  originalQueue: Track[]
  positionSeconds: number
  queue: Track[]
  queueContext: PlayerQueueContext | null
  repeatMode: RepeatModeType
}

export interface NativePlaybackStatusSnapshot {
  currentTrack: Track | null
  currentTrackId: string | null
  isPlaying: boolean
  positionSeconds: number
  repeatMode: RepeatModeType
}

export interface SyncCurrentTrackOptions {
  activeIndex?: number | null
  activeTrack?: NativeTrack | null
  skipQueueRefresh?: boolean
}

export interface PersistPlaybackSessionOptions {
  consumeImmediateQueue?: boolean
  cursor?: Partial<PersistedPlaybackCursorSnapshot> & {
    currentTrack?: Track | null
  }
  cursorOnly?: boolean
  force?: boolean
  skipQueueSync?: boolean
}
