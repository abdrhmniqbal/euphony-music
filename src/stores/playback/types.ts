/**
 * Purpose: Declares types and schemas for active playback media sources, including album, artist, album-artist, folder, genre, and playlist.
 * Caller: Playback service, queue actions, and action sheets.
 * Dependencies: None.
 * Main Functions: Types only.
 * Side Effects: None.
 */

export type MediaType = "album" | "artist" | "folder" | "genre" | "playlist" | "track"

export interface PlayFromSource {
  type: Exclude<MediaType, "track">
  id: string
}
