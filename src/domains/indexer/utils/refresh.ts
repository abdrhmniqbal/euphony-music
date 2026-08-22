import { queryClient } from "@/core/query/query-client"
import { logInfo } from "@/core/log/service"

import {
  ALBUMS_KEY,
  ARTISTS_KEY,
  FAVORITES_KEY,
  GENRES_KEY,
  HISTORY_RECENTLY_PLAYED_KEY,
  HISTORY_TOP_TRACKS_KEY,
  PLAYLISTS_KEY,
  SEARCH_KEY,
  TRACKS_KEY,
} from "@/domains/library/query-keys"

const INDEXED_MEDIA_QUERY_KEYS = [
  [TRACKS_KEY],
  ["library", TRACKS_KEY],
  [ALBUMS_KEY],
  [ARTISTS_KEY],
  [GENRES_KEY],
  [PLAYLISTS_KEY],
  [FAVORITES_KEY],
  ["library", FAVORITES_KEY],
  [SEARCH_KEY],
  ["search-genres"],
  ["genre-details"],
  ["genre-top-tracks"],
  ["genre-albums"],
  [HISTORY_RECENTLY_PLAYED_KEY],
  [HISTORY_TOP_TRACKS_KEY],
]

export async function refreshIndexedMediaState() {
  logInfo("Refreshing indexed media state")
  await Promise.all(
    INDEXED_MEDIA_QUERY_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
  )
  logInfo("Indexed media state refreshed")
}
