import { playHistory, playlistTracks, trackArtists, trackGenres } from "@/db/schema"

export const trackRelationTables = [
  trackArtists,
  trackGenres,
  playlistTracks,
  playHistory,
] as const
