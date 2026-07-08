import type { Track } from "@/modules/tracks/types"

import type { PlaybackQueueContext, PlayFromSource } from "./types"

import type { ObjectValues } from "@/utils/types"

export const RepeatModes = {
  NO_REPEAT: "no-repeat",
  REPEAT: "repeat",
  REPEAT_ONE: "repeat-one",
} as const

export type RepeatMode = ObjectValues<typeof RepeatModes>

export interface PlaybackStore {
  _hasHydrated: boolean
  _init: (state: PlaybackStore) => Promise<void>

  getTrack: (trackKey: string) => Promise<Track | undefined>
  reset: () => Promise<void>
  resetOnCrash: () => Promise<void>
  restoreActiveTrack: () => Promise<void>

  _hasRestoredPosition: boolean
  _restoredTrackKey: string | undefined

  isPlaying: boolean
  lastPosition: number

  repeat: RepeatMode
  shuffle: boolean

  playingFrom: PlayFromSource | undefined
  playingFromName: string
  /** Display label for full player. May exist without a resolvable persisted source. */
  queueContext: PlaybackQueueContext | null

  orderSnapshot: string[]
  queue: string[]

  activeKey: string | undefined
  activeTrack: Track | undefined
  queuePosition: number
  numQueuedNext: number

  isReplayGainEnabled: boolean
  preAmpWTags: number
  preAmpWOTags: number

  restoreVolume: boolean
  volume: number
}

export const PersistedFields: string[] = [
  "_restoredTrackKey",
  "lastPosition",
  "isPlaying",
  "repeat",
  "shuffle",
  "playingFrom",
  "playingFromName",
  "queueContext",
  "orderSnapshot",
  "queue",
  "activeKey",
  "activeTrack",
  "queuePosition",
  "isReplayGainEnabled",
  "preAmpWTags",
  "preAmpWOTags",
  "restoreVolume",
  "volume",
] satisfies Array<keyof PlaybackStore>
