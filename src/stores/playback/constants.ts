/**
 * Purpose: Defines playback store constants and persisted field names.
 * Caller: Playback store and actions.
 * Dependencies: player domain types.
 * Main Functions: RepeatModes, PersistedFields, PlaybackStore.
 * Side Effects: None.
 */

import type { PlayerQueueContext, RepeatModeType, Track } from "@/modules/player/player.types"
import type { PlayFromSource } from "./types"

export const RepeatModes = {
  NO_REPEAT: "off",
  REPEAT: "queue",
  REPEAT_ONE: "track",
} as const satisfies Record<string, RepeatModeType>

export interface PlaybackStore {
  _hasHydrated: boolean
  isPlaying: boolean
  lastPosition: number
  duration: number
  repeat: RepeatModeType
  shuffle: boolean
  playingFrom: PlayFromSource | undefined
  playingFromName: string
  orderSnapshot: string[]
  queue: string[]
  activeKey: string | undefined
  activeTrack: Track | undefined
  queuePosition: number
  numQueuedNext: number
  queueContext: PlayerQueueContext | null
  tracks: Track[]
  reset: () => Promise<void>
  getTrack: (trackKey: string) => Promise<Track | undefined>
}

export const PersistedFields: string[] = [
  "lastPosition",
  "duration",
  "repeat",
  "shuffle",
  "playingFrom",
  "playingFromName",
  "orderSnapshot",
  "queue",
  "activeKey",
  "queuePosition",
  "queueContext",
] satisfies Array<keyof PlaybackStore>
