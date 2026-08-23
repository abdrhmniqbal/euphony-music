import type { DataTrack } from "./types"

export type TrackSortField =
  | "name"
  | "artistName"
  | "albumName"
  | "duration"
  | "discoverTime"
  | "modificationTime"

function getFieldValue(track: DataTrack, field: TrackSortField): string | number {
  switch (field) {
    case "name":
      return track.name ?? ""
    case "artistName":
      return track.artistName ?? ""
    case "albumName":
      return track.albumName ?? ""
    case "duration":
      return track.duration ?? 0
    case "discoverTime":
      return track.discoverTime ?? 0
    case "modificationTime":
      return track.modificationTime ?? 0
  }
}

export function sortTracks(
  tracks: DataTrack[],
  field: TrackSortField,
  isAsc: boolean
): DataTrack[] {
  const sorted = [...tracks].sort((a, b) => {
    const left = getFieldValue(a, field)
    const right = getFieldValue(b, field)

    if (typeof left === "number" && typeof right === "number") {
      return left - right
    }

    return String(left).localeCompare(String(right), undefined, { sensitivity: "base" })
  })

  return isAsc ? sorted : sorted.reverse()
}
