/**
 * Purpose: Defines playback source types for queue restoration and playback origin labels.
 * Caller: Playback store/actions and player facades.
 * Dependencies: None.
 * Main Functions: MediaType, PlayFromSource.
 * Side Effects: None.
 */

export type MediaType =
  | "album"
  | "artist"
  | "favorites"
  | "folder"
  | "genre"
  | "playlist"
  | "search"
  | "track"
  | "trackList"

export type PlayFromSource = { type: Exclude<MediaType, "track">; id: string }
