/**
 * Purpose: Derives metadata labels, values, and navigation targets for track metadata sheet, including album artist display.
 * Caller: Track metadata sheet UI.
 * Dependencies: Localization, track model, artist picker helpers, split-value settings, and track metadata utilities.
 * Main Functions: dedupeValues(), buildArtistSelectionItems(), deriveTrackMetadata(), buildMetadataLayoutItems()
 * Side Effects: None.
 */

import type { TFunction } from "i18next"
import type { ArtistPickerSheetItem } from "@/components/blocks/artist-picker-sheet"
import type { Track } from "@/modules/player/store"
import {
  formatQualityLabel,
  normalizeCodecLabel,
  resolveAudioFormat,
} from "@/modules/tracks/track-metadata-utils"
import { splitArtistsValue, splitGenresValue } from "@/modules/settings/split-multiple-values"
import { formatDuration } from "@/utils/format"

export interface MetadataValueSegment {
  value: string
  onPress?: () => void
}

export interface MetadataItem {
  label: string
  segments: MetadataValueSegment[]
  fullWidth?: boolean
}

export interface MetadataLayoutItem extends MetadataItem {
  displayValue: string
  isFullWidth: boolean
}

export function dedupeValues(values: string[]) {
  const seen = new Set<string>()
  return values.filter((value) => {
    const key = value.toLowerCase()
    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

interface FullTrackData {
  artwork?: string | null
  album?: {
    artwork?: string | null
    title?: string | null
    artist?: { name?: string | null } | null
  } | null
  artist?: { name?: string | null } | null
  featuredArtists?: Array<{ artist?: { name?: string | null } | null }> | null
  genres?: Array<{ genre?: { name?: string | null } | null }> | null
}

export function buildArtistSelectionItems({
  artistNames,
  fullTrackData,
  buildArtistPickerItems,
  trackCountLabel,
}: {
  artistNames: string[]
  fullTrackData: FullTrackData | null | undefined
  buildArtistPickerItems: (
    source: {
      artwork?: string | null
      albumArtwork?: string | null
      artist?: { name?: string | null } | null
      featuredArtists?: Array<{ artist?: { name?: string | null } | null }> | null
    },
    names: string[],
    formatCount: (count: number) => string
  ) => ArtistPickerSheetItem[]
  trackCountLabel: (count: number) => string
}) {
  const richArtistItems = buildArtistPickerItems(
    {
      artwork: fullTrackData?.artwork,
      albumArtwork: fullTrackData?.album?.artwork,
      artist: fullTrackData?.artist,
      featuredArtists: fullTrackData?.featuredArtists,
    },
    artistNames,
    trackCountLabel
  )

  return richArtistItems.length > 0 ? richArtistItems : artistNames.map((value) => ({ value }))
}

export function deriveTrackMetadata({
  t,
  track,
  resolvedFileUri,
  fullTrackData,
  splitMultipleValueConfig,
  onOpenArtistSelection,
  onOpenAlbum,
  onOpenGenreSelection,
  onOpenFile,
}: {
  t: TFunction
  track: Track
  resolvedFileUri: string | null
  fullTrackData: FullTrackData | null | undefined
  splitMultipleValueConfig: Parameters<typeof splitArtistsValue>[1]
  onOpenArtistSelection: (values: string[]) => void
  onOpenAlbum: (albumName: string) => void
  onOpenGenreSelection: (values: string[]) => void
  onOpenFile: () => void
}) {
  const unknownValue = t("common.unknown")
  const fileName = resolveFileName(track, t)
  const filePath = resolveFilePath(track, resolvedFileUri, t)
  const lastPlayed = resolveLastPlayed(track.lastPlayedAt, t)
  const codecLabel = normalizeCodecLabel(track.audioCodec)
  const formatLabel = resolveAudioFormat(track.audioFormat, fileName, codecLabel)
  const qualityLabel = formatQualityLabel(track.audioSampleRate, track.audioBitrate)
  const durationLabel = formatDuration(track.duration || 0)

  const relationNames = [
    fullTrackData?.artist?.name?.trim(),
    ...(fullTrackData?.featuredArtists?.map((entry) => entry.artist?.name?.trim()) ?? []),
  ].filter((value): value is string => Boolean(value))

  const artistNames =
    relationNames.length > 0
      ? dedupeValues(relationNames)
      : dedupeValues(splitArtistsValue(track.artist, splitMultipleValueConfig))

  const relationAlbumName = fullTrackData?.album?.title?.trim()
  const albumNames = relationAlbumName
    ? [relationAlbumName]
    : track.album?.trim()
      ? [track.album.trim()]
      : []

  const relationAlbumArtistNames = fullTrackData?.album?.artist?.name?.trim()
    ? [fullTrackData.album.artist.name.trim()]
    : []
  const albumArtistNames =
    relationAlbumArtistNames.length > 0
      ? dedupeValues(relationAlbumArtistNames)
      : dedupeValues(splitArtistsValue(track.albumArtist, splitMultipleValueConfig))

  const relationGenreNames =
    fullTrackData?.genres
      ?.map((entry) => entry.genre?.name?.trim())
      .filter((value): value is string => Boolean(value))
      .filter((value, index, all) => all.indexOf(value) === index) ?? []

  const genreNames =
    relationGenreNames.length > 0
      ? relationGenreNames
      : dedupeValues(splitGenresValue(track.genre, splitMultipleValueConfig))

  const quickFacts = [
    { label: t("track.metadata.quality"), value: qualityLabel },
    { label: t("track.metadata.codec"), value: codecLabel || unknownValue },
    { label: t("track.metadata.format"), value: formatLabel },
  ]

  const metadataItems: MetadataItem[] = [
    {
      label: t("track.metadata.artist"),
      segments:
        artistNames.length > 0
          ? splitMultipleValueConfig.artistSplitMode === "original" && track.artist?.trim()
            ? [
                {
                  value: track.artist.trim(),
                  onPress: () => onOpenArtistSelection(artistNames),
                },
              ]
            : artistNames.map((name) => ({
                value: name,
                onPress: () => onOpenArtistSelection(artistNames),
              }))
          : [{ value: t("library.unknownArtist") }],
      fullWidth:
        (artistNames.length > 0 ? artistNames.join(", ") : t("library.unknownArtist")).length > 24,
    },
    {
      label: t("track.metadata.album"),
      segments:
        albumNames.length > 0
          ? albumNames.map((name) => ({
              value: name,
              onPress: () => onOpenAlbum(name),
            }))
          : [{ value: t("library.unknownAlbum") }],
      fullWidth:
        (albumNames.length > 0 ? albumNames.join(", ") : t("library.unknownAlbum")).length > 24,
    },
    {
      label: t("track.metadata.albumArtist"),
      segments:
        albumArtistNames.length > 0
          ? albumArtistNames.map((name) => ({
              value: name,
              onPress: () => onOpenArtistSelection(albumArtistNames),
            }))
          : [{ value: t("library.unknownArtist") }],
      fullWidth:
        (albumArtistNames.length > 0 ? albumArtistNames.join(", ") : t("library.unknownArtist"))
          .length > 24,
    },
    {
      label: t("track.metadata.genre"),
      segments:
        genreNames.length > 0
          ? genreNames.map((genreName) => ({
              value: genreName,
              onPress: () => onOpenGenreSelection(genreNames),
            }))
          : [{ value: unknownValue }],
      fullWidth: (genreNames.length > 0 ? genreNames.join(", ") : unknownValue).length > 24,
    },
    {
      label: t("track.metadata.year"),
      segments: [{ value: track.year ? String(track.year) : unknownValue }],
    },
    {
      label: t("track.metadata.trackDisc"),
      segments: [
        {
          value:
            track.trackNumber || track.discNumber
              ? `${track.trackNumber ?? "?"} / ${track.discNumber ?? "?"}`
              : unknownValue,
        },
      ],
    },
    {
      label: t("track.metadata.duration"),
      segments: [{ value: durationLabel }],
    },
    {
      label: t("track.metadata.playCount"),
      segments: [{ value: String(track.playCount || 0) }],
    },
    {
      label: t("track.metadata.lastPlayed"),
      segments: [{ value: lastPlayed }],
      fullWidth: true,
    },
    {
      label: t("track.metadata.file"),
      segments: [
        {
          value: filePath,
          onPress: track.uri ? onOpenFile : undefined,
        },
      ],
      fullWidth: true,
    },
  ]

  return {
    artistNames,
    albumArtistNames,
    genreNames,
    quickFacts,
    metadataItems,
  }
}

export function buildMetadataLayoutItems(metadataItems: MetadataItem[]): MetadataLayoutItem[] {
  const metadataLayoutItems = metadataItems.map((item) => ({
    ...item,
    displayValue: item.segments.map((segment) => segment.value).join(", "),
    isFullWidth: Boolean(item.fullWidth),
  }))

  let pendingHalfWidthIndex: number | null = null
  for (let i = 0; i < metadataLayoutItems.length; i += 1) {
    const currentItem = metadataLayoutItems[i]
    if (!currentItem) {
      continue
    }

    if (currentItem.isFullWidth) {
      pendingHalfWidthIndex = null
      continue
    }

    if (pendingHalfWidthIndex !== null) {
      pendingHalfWidthIndex = null
      continue
    }

    const nextItem = metadataLayoutItems[i + 1]
    const nextCanPairInSameRow = Boolean(nextItem && !nextItem.isFullWidth)

    if (!nextCanPairInSameRow) {
      currentItem.isFullWidth = true
      pendingHalfWidthIndex = null
      continue
    }

    pendingHalfWidthIndex = i
  }

  return metadataLayoutItems
}

function resolveFileName(track: Track, t: TFunction) {
  if (track.filename) {
    return track.filename
  }

  const uriPart = track.uri.split("/").pop() || ""
  if (!uriPart) {
    return t("library.unknownFile")
  }

  try {
    return decodeURIComponent(uriPart)
  } catch {
    return uriPart
  }
}

function resolveFilePath(track: Track, resolvedFileUri: string | null, t: TFunction) {
  if (!track.uri) {
    return t("library.unknownFile")
  }

  const uri = resolvedFileUri || track.uri
  const normalizedPath = uri.startsWith("file://") ? uri.slice("file://".length) : uri

  try {
    return decodeURIComponent(normalizedPath)
  } catch {
    return normalizedPath
  }
}

function resolveLastPlayed(lastPlayedAt: number | undefined, t: TFunction) {
  if (!lastPlayedAt || !Number.isFinite(lastPlayedAt)) {
    return t("track.never")
  }

  const date = new Date(lastPlayedAt)
  if (Number.isNaN(date.getTime())) {
    return t("track.never")
  }

  return date.toLocaleString()
}
