export type MediaType = "album" | "artist" | "folder" | "genre" | "playlist" | "track"

export interface PlayFromSource {
  type: Exclude<MediaType, "track">
  id: string
}
