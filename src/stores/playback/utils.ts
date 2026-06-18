import type { PlayFromSource } from "./types"

import { getAlbumDetails, getAlbumTracks } from "@/modules/library/repository"
import { getSortedArtistTracks } from "@/modules/library/repository"
import { getSortedFolderTracks } from "@/modules/library/repository"
import { getSortedGenreTracks } from "@/modules/genres/repository"
import { getPlaylistTracks } from "@/modules/playlist/repository"
import { getSortedTracks } from "@/modules/tracks/repository"
import { FavoritesPlaylistKey, ReservedNames, ReservedPlaylists } from "@/modules/media/constants"
import { i18n } from "@/modules/localization/i18n"
import { shuffleArray } from "@/utils/object"

export function arePlaybackSourceEqual(
  source1: PlayFromSource | undefined,
  source2: PlayFromSource
) {
  if (!source1) return false
  const keys = Object.keys(source1) as Array<keyof PlayFromSource>
  return keys.every((key) => source1[key] === source2[key])
}

export function extractTrackId(key: string) {
  return key.split("__")[0]!
}

export async function getSourceName({ type, id }: PlayFromSource) {
  let name = ""
  try {
    if (type === "artist" || type === "genre") {
      name = id
    } else if (type === "playlist") {
      name = id
      if (id === FavoritesPlaylistKey) name = i18n.t("term.favoriteTracks")
      else if (id === ReservedPlaylists.tracks) name = i18n.t("term.tracks")
    } else if (type === "folder") {
      name = id.split("/").at(-2) ?? ""
    } else {
      name = (await getAlbumDetails(id)).name
    }
  } catch {}
  return name
}

export async function getTrackIdsList({ type, id }: PlayFromSource) {
  let trackIds: Array<{ id: string }> = []

  try {
    if (type === "album") trackIds = await getAlbumTracks(id, true)
    else if (type === "artist") trackIds = await getSortedArtistTracks(id, true)
    else if (type === "folder") trackIds = await getSortedFolderTracks(id, true)
    else if (type === "genre") trackIds = await getSortedGenreTracks(id, true)
    else if (ReservedNames.has(id)) trackIds = await getSortedTracks(true)
    else trackIds = await getPlaylistTracks(id, true)
  } catch {}

  return trackIds.map((t) => t.id)
}

export function getUpdatedLists(newPlayingList: string[], shuffle: boolean, startTrackId?: string) {
  const usedList = shuffle ? shuffleArray(newPlayingList) : newPlayingList

  const newLocation =
    startTrackId !== undefined ? usedList.findIndex((tId) => startTrackId === tId) : -1

  return {
    orderSnapshot: newPlayingList,
    queue: usedList,
    queuePosition: newLocation === -1 ? 0 : newLocation,
    numQueuedNext: 0,
  }
}
