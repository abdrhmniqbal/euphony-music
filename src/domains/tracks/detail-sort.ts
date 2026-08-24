import { isString } from "@/lib/guards"

import type { PlayerTrack } from "@/playback/types"

export type SortOrder = "asc" | "desc"

export interface DetailSortConfig {
  field: DetailSortField
  order: SortOrder
}

export type DetailSortField =
  | "title"
  | "artist"
  | "album"
  | "year"
  | "dateAdded"
  | "filename"
  | "playCount"
  | "trackNumber"
  | "name"
  | "trackCount"

type ComparableValue = number | string | null | undefined

interface AlbumSortable {
  artist?: string | null
  dateAdded?: number | null
  title?: string | null
  trackCount?: number | null
  year?: number | null
}

interface ArtistSortable {
  dateAdded?: number | null
  name?: string | null
  trackCount?: number | null
}

function compareValues(a: ComparableValue, b: ComparableValue, order: SortOrder) {
  if (a === b) return 0
  if (a === undefined || a === null) return 1
  if (b === undefined || b === null) return -1

  if (isString(a) && isString(b)) {
    return order === "asc"
      ? a.localeCompare(b, undefined, { sensitivity: "base" })
      : b.localeCompare(a, undefined, { sensitivity: "base" })
  }

  if (a < b) return order === "asc" ? -1 : 1
  if (a > b) return order === "asc" ? 1 : -1
  return 0
}

function getTrackSortValue(track: PlayerTrack, field: DetailSortField): ComparableValue {
  switch (field) {
    case "filename":
      return track.filename || track.uri.split("/").pop()
    case "title":
      return (track.title || track.filename || "").toLowerCase()
    case "artist":
      return (track.artist || "Unknown Artist").toLowerCase()
    case "album":
      return (track.album || "Unknown Album").toLowerCase()
    case "year":
      return track.year
    case "dateAdded":
      return track.dateAdded
    case "playCount":
      return track.playCount
    default:
      return undefined
  }
}

export function sortPlayerTracks(tracks: PlayerTrack[], config: DetailSortConfig): PlayerTrack[] {
  const { field, order } = config
  return [...tracks].sort((a, b) => {
    if (field === "trackNumber") {
      const discCompare = compareValues(a.discNumber || 1, b.discNumber || 1, order)
      if (discCompare !== 0) {
        return discCompare
      }

      const trackCompare = compareValues(a.trackNumber || 0, b.trackNumber || 0, order)
      if (trackCompare !== 0) {
        return trackCompare
      }

      const titleA = (a.title || a.filename || "").toLowerCase()
      const titleB = (b.title || b.filename || "").toLowerCase()
      return compareValues(titleA, titleB, order)
    }

    const aVal = getTrackSortValue(a, field)
    const bVal = getTrackSortValue(b, field)

    const primaryResult = compareValues(aVal, bVal, order)
    if (field === "playCount" && primaryResult === 0) {
      return compareValues(a.lastPlayedAt || 0, b.lastPlayedAt || 0, "desc")
    }

    return primaryResult
  })
}

export function sortAlbums<T extends AlbumSortable>(albums: T[], config: DetailSortConfig): T[] {
  const { field, order } = config
  return [...albums].sort((a, b) => {
    const aVal =
      field === "title" ||
      field === "artist" ||
      field === "year" ||
      field === "dateAdded" ||
      field === "trackCount"
        ? a[field]
        : undefined
    const bVal =
      field === "title" ||
      field === "artist" ||
      field === "year" ||
      field === "dateAdded" ||
      field === "trackCount"
        ? b[field]
        : undefined

    if (field === "title" || field === "artist") {
      return compareValues(
        (aVal ?? "").toString().toLowerCase(),
        (bVal ?? "").toString().toLowerCase(),
        order
      )
    }

    return compareValues(aVal, bVal, order)
  })
}

export function sortArtists<T extends ArtistSortable>(artists: T[], config: DetailSortConfig): T[] {
  const { field, order } = config
  return [...artists].sort((a, b) => {
    const aVal =
      field === "name" || field === "dateAdded" || field === "trackCount" ? a[field] : undefined
    const bVal =
      field === "name" || field === "dateAdded" || field === "trackCount" ? b[field] : undefined

    if (field === "name") {
      return compareValues(
        (aVal ?? "").toString().toLowerCase(),
        (bVal ?? "").toString().toLowerCase(),
        order
      )
    }

    return compareValues(aVal, bVal, order)
  })
}
