import { queryClient } from "@/lib/tanstack-query"
import { invalidateQueryKeys } from "@/lib/query-invalidation"
import { FAVORITES_KEY } from "@/modules/favorites/keys"
import { GENRES_KEY } from "@/modules/genres/keys"
import { HISTORY_RECENTLY_PLAYED_KEY, HISTORY_TOP_TRACKS_KEY } from "@/modules/history/keys"
import { ALBUMS_KEY, ARTISTS_KEY, SEARCH_KEY } from "@/modules/library/keys"
import { logInfo } from "@/modules/logging/service"
import { PLAYLISTS_KEY } from "@/modules/playlist/keys"
import { loadTracks } from "@/modules/player/library"
import {
  GENRE_ALBUMS_KEY,
  GENRE_DETAILS_KEY,
  GENRE_TOP_TRACKS_KEY,
  SEARCH_GENRES_KEY,
} from "@/modules/search/keys"
import { TRACKS_KEY } from "@/modules/tracks/keys"

export async function refreshIndexedMediaState() {
  logInfo("Refreshing indexed media state")
  await loadTracks()
  await invalidateQueryKeys(queryClient, [
    [TRACKS_KEY],
    ["library", TRACKS_KEY],
    [ALBUMS_KEY],
    [ARTISTS_KEY],
    [GENRES_KEY],
    [PLAYLISTS_KEY],
    [FAVORITES_KEY],
    ["library", FAVORITES_KEY],
    [SEARCH_KEY],
    [SEARCH_GENRES_KEY],
    [GENRE_DETAILS_KEY],
    [GENRE_TOP_TRACKS_KEY],
    [GENRE_ALBUMS_KEY],
    [HISTORY_RECENTLY_PLAYED_KEY],
    [HISTORY_TOP_TRACKS_KEY],
  ])
  logInfo("Indexed media state refreshed")
}
