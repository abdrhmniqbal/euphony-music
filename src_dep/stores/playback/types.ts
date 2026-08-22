/**
 * Purpose: Declares types and schemas for active playback media sources, including album, artist, album-artist, folder, genre, and playlist.
 * Caller: Playback service, queue actions, and action sheets.
 * Dependencies: None.
 * Main Functions: Types only.
 * Side Effects: None.
 */

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

export function createTrackListQueueContext(title: string): PlaybackQueueContext {
  return createPlaybackQueueContext("trackList", title)
}

export function createFavoritesQueueContext(title: string): PlaybackQueueContext {
  return createPlaybackQueueContext("favorites", title)
}

export function createSearchQueueContext(title: string): PlaybackQueueContext {
  return createPlaybackQueueContext("search", title)
}

export function createMixQueueContext(title: string): PlaybackQueueContext {
  return createPlaybackQueueContext("mix", title)
}
