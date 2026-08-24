import type { DataTrack } from "./types"

export type TrackSortField =
  | "name"
  | "artistName"
  | "albumName"
  | "duration"
  | "discoverTime"
  | "modificationTime"

type NumericSortField = "duration" | "discoverTime" | "modificationTime"

type TextSortField = Exclude<TrackSortField, NumericSortField>

function isNumericField(field: TrackSortField): field is NumericSortField {
  return field === "duration" || field === "discoverTime" || field === "modificationTime"
}

function getNumericValue(track: DataTrack, field: NumericSortField): number {
  switch (field) {
    case "duration":
      return track.duration ?? 0
    case "discoverTime":
      return track.discoverTime ?? 0
    case "modificationTime":
      return track.modificationTime ?? 0
  }
}

function getTextValue(track: DataTrack, field: TextSortField): string {
  switch (field) {
    case "name":
      return track.name ?? ""
    case "artistName":
      return track.artistName ?? ""
    case "albumName":
      return track.albumName ?? ""
  }
}

export function sortTracks(
  tracks: DataTrack[],
  field: TrackSortField,
  isAsc: boolean
): DataTrack[] {
  const sorted = [...tracks].sort((a, b) => {
    if (isNumericField(field)) {
      return getNumericValue(a, field) - getNumericValue(b, field)
    }

    return getTextValue(a, field).localeCompare(getTextValue(b, field), undefined, {
      sensitivity: "base",
    })
  })

  return isAsc ? sorted : sorted.reverse()
}
