export const EXTERNAL_TRACK_ID_PREFIX = "external:"

export type RepeatModeType = "off" | "track" | "queue"

export type SleepTimerMode = "off" | "minutes" | "playCount" | "trackEnd" | "clock"

export interface SleepTimerState {
  mode: SleepTimerMode
  minutes: number
  playCount: number
  targetTrackId: string | null
  targetTimestamp: number | null
  clockHour: number | null
  clockMinute: number | null
  lastCompletedTrackId: string | null
}

export type MediaType = "album" | "artist" | "folder" | "genre" | "playlist" | "track" | "mix"

export interface PlayFromSource {
  type: Exclude<MediaType, "track">
  id: string
}

export type PlaybackQueueContextType =
  | "album"
  | "artist"
  | "playlist"
  | "genre"
  | "search"
  | "favorites"
  | "folder"
  | "trackList"
  | "external"
  | "mix"

export interface PlaybackQueueContext {
  type: PlaybackQueueContextType
  title: string
}

export function createPlaybackQueueContext(
  type: PlaybackQueueContextType,
  title: string
): PlaybackQueueContext {
  return { type, title }
}

export interface PlayerTrack {
  id: string
  title: string
  artist?: string
  artistId?: string
  albumArtist?: string
  album?: string
  albumId?: string
  duration: number
  uri: string
  image?: string
  albumArtwork?: string
  artists?: string[]
  artistName?: string | null
  rawArtistName?: string | null
  albumName?: string | null
  audioBitrate?: number
  audioSampleRate?: number
  audioCodec?: string
  audioFormat?: string
  lyrics?: string
  fileHash?: string
  scanTime?: number
  isDeleted?: boolean
  playCount?: number
  lastPlayedAt?: number
  year?: number
  filename?: string
  dateAdded?: number
  isFavorite?: boolean
  discNumber?: number
  trackNumber?: number
  genre?: string
  isExternal?: boolean
}

export const RepeatModes = {
  NO_REPEAT: "no-repeat",
  REPEAT: "repeat",
  REPEAT_ONE: "repeat-one",
} as const

export type RepeatMode = (typeof RepeatModes)[keyof typeof RepeatModes]
