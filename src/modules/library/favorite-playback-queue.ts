import type { FavoriteEntry } from "@/modules/favorites/types"
import type { Track } from "@/modules/player/types"
import { getPlaylistTrackIdsByPlaylistIds } from "@/modules/playlist/repository"

function appendUniqueTrack(queue: Track[], seenTrackIds: Set<string>, track: Track | undefined) {
  if (!track || seenTrackIds.has(track.id)) {
    return
  }

  seenTrackIds.add(track.id)
  queue.push(track)
}

export async function buildFavoritesPlaybackQueue(
  favoriteEntries: FavoriteEntry[],
  tracks: Track[]
): Promise<Track[]> {
  const queue: Track[] = []
  const seenTrackIds = new Set<string>()
  const trackById = new Map(tracks.map((track) => [track.id, track]))
  const playlistFavorites = favoriteEntries.filter((favorite) => favorite.type === "playlist")
  const playlistRows = await getPlaylistTrackIdsByPlaylistIds(
    playlistFavorites.map((favorite) => favorite.id)
  )
  const playlistTrackIds = new Map<string, string[]>()

  for (const row of playlistRows) {
    const currentIds = playlistTrackIds.get(row.playlistId) ?? []
    currentIds.push(row.trackId)
    playlistTrackIds.set(row.playlistId, currentIds)
  }

  for (const favorite of favoriteEntries) {
    switch (favorite.type) {
      case "track":
        appendUniqueTrack(queue, seenTrackIds, trackById.get(favorite.id))
        break
      case "album":
        for (const track of tracks) {
          if (track.albumId === favorite.id) {
            appendUniqueTrack(queue, seenTrackIds, track)
          }
        }
        break
      case "artist":
        for (const track of tracks) {
          const artistNames = (track.artist || "")
            .split(",")
            .map((name) => name.trim().toLowerCase())
          if (
            track.artistId === favorite.id ||
            artistNames.includes(favorite.name.trim().toLowerCase())
          ) {
            appendUniqueTrack(queue, seenTrackIds, track)
          }
        }
        break
      case "playlist":
        for (const trackId of playlistTrackIds.get(favorite.id) ?? []) {
          appendUniqueTrack(queue, seenTrackIds, trackById.get(trackId))
        }
        break
    }
  }

  return queue
}
