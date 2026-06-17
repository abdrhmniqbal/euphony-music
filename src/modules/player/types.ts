/**
 * Purpose: Defines shared playback domain types for tracks, queue context, albums, artists, lyrics, and repeat state.
 * Caller: player services, stores, selectors, adapters, UI blocks, and track/library modules.
 * Dependencies: none.
 * Main Functions: Track, PlayerQueueContext, Album, Artist, LyricLine, RepeatModeType, SleepTimerState
 * Side Effects: None.
 */

export const EXTERNAL_TRACK_ID_PREFIX = "external:"

export interface LyricLine {
  time: number
  text: string
}

export type RepeatModeType = "off" | "track" | "queue"

export type SleepTimerMode =
  | "off"
  | "minutes"
  | "playCount"
  | "trackEnd"
  | "clock"

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

export type PlayerQueueContextType =
  | "album"
  | "artist"
  | "playlist"
  | "genre"
  | "search"
  | "favorites"
  | "folder"
  | "trackList"
  | "external"

export interface PlayerQueueContext {
  type: PlayerQueueContextType
  title: string
}

export interface Track {
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

export interface Album {
  id: string
  title: string
  artist: string
  albumArtist?: string
  image?: string
  trackCount: number
  year: number
  dateAdded: number
}

export interface Artist {
  id: string
  name: string
  trackCount: number
  image?: string
  dateAdded: number
}
