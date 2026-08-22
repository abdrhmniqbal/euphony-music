import { getQueueSourceTrackIds } from "@/domains/library/queue-sources"
import { FavoritesPlaylistKey, ReservedPlaylists } from "@/domains/library/media-constants"
import { i18n } from "@/core/localization/i18n"

import type { PlayFromSource } from "./types"
import { shuffleArray } from "@/lib/object"

export async function getSourceName({ type, id }: PlayFromSource): Promise<string> {
  if (type === "playlist") {
    if (id === FavoritesPlaylistKey) return i18n.t("term.favoritesLabel")
    if (id === ReservedPlaylists.tracks) return i18n.t("term.allTracks")
    return id
  }
  if (type === "folder") {
    return id.split("/").at(-2) ?? ""
  }
  return id
}

export async function getTrackIdsList(source: PlayFromSource): Promise<string[]> {
  try {
    return await getQueueSourceTrackIds(source)
  } catch (error) {
    console.warn(`Failed to get track ids for source: ${source.type}`, error)
    return []
  }
}

export function getUpdatedLists(newPlayingList: string[], shuffle: boolean, startTrackId?: string) {
  let usedList = newPlayingList
  let newLocation = 0

  if (shuffle) {
    const remaining = newPlayingList.filter((id) => id !== startTrackId)
    const shuffledRemaining = shuffleArray(remaining)
    usedList = startTrackId !== undefined ? [startTrackId, ...shuffledRemaining] : shuffledRemaining
    newLocation = 0
  } else {
    newLocation =
      startTrackId !== undefined ? newPlayingList.findIndex((tId) => startTrackId === tId) : -1
  }

  return {
    orderSnapshot: newPlayingList,
    queue: usedList,
    queuePosition: newLocation === -1 ? 0 : newLocation,
    numQueuedNext: 0,
  }
}
