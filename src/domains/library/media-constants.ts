export const FavoritesPlaylistKey = "favorites"

export const ReservedPlaylists = {
  tracks: "Tracks",
  create: "create",
  modify: "modify",
} as const

export type ReservedPlaylistName = (typeof ReservedPlaylists)[keyof typeof ReservedPlaylists]

export const ReservedNames = new Set<string>(Object.values(ReservedPlaylists))
