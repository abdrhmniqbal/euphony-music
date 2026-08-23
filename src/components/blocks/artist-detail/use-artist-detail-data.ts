import { useLocalSearchParams } from "expo-router"
import * as React from "react"
import { useTranslation } from "react-i18next"

import type { Album } from "@/components/blocks/album-grid"
import { buildArtistAlbums } from "@/domains/artists/utils"
import { useArtistByName } from "@/domains/artists/queries"
import { useLibrarySortStore } from "@/domains/library/sort-store"
import { sortAlbums, sortPlayerTracks, type DetailSortConfig } from "@/domains/tracks/detail-sort"
import { splitArtistsValue } from "@/domains/tracks/split-engine"
import { useTracks } from "@/domains/tracks/queries"
import { getPreferenceState } from "@/core/preferences/store"
import type { SplitMultipleValueConfig } from "@/core/preferences/types"
import { resolveArtistTransitionId } from "@/lib/transition-ids"
import { toPlayerTrack } from "@/playback/player-track"
import type { PlayerTrack } from "@/playback/types"

export function trackMatchesArtistName(
  track: PlayerTrack,
  normalizedArtistName: string,
  splitMultipleValueConfig: SplitMultipleValueConfig
) {
  const candidateValues = [track.artist, track.albumArtist]
  return candidateValues.some((value) =>
    splitArtistsValue(value ?? "", splitMultipleValueConfig).some(
      (artist) => artist.trim().toLowerCase() === normalizedArtistName
    )
  )
}

function mergeArtistTracks(primary: PlayerTrack[], fallback: PlayerTrack[]) {
  const tracksById = new Map(primary.map((track) => [track.id, track]))
  for (const track of fallback) {
    if (!tracksById.has(track.id)) {
      tracksById.set(track.id, track)
    }
  }
  return Array.from(tracksById.values())
}

function buildAlbumGridItems(
  artistAlbums: ReturnType<typeof buildArtistAlbums>,
  unknownArtist: string
): Album[] {
  return artistAlbums.map(
    (album): Album => ({
      id: album.title,
      title: album.title,
      artist: album.albumArtist || album.artist || unknownArtist,
      albumArtist: album.albumArtist,
      image: album.image,
      trackCount: album.trackCount,
      year: album.year || 0,
      dateAdded: 0,
    })
  )
}

export type ArtistView = "overview" | "tracks" | "albums" | "featuredOn"

export function useArtistDetailData(activeView: ArtistView) {
  const { t } = useTranslation()
  const { name, transitionId } = useLocalSearchParams<{
    name: string
    transitionId?: string
  }>()
  const splitMultipleValueConfig = getPreferenceState().splitMultipleValueConfig
  const allSortConfigs = useLibrarySortStore((state) => state.sortConfig)
  const artistName = React.useMemo(() => {
    try {
      return decodeURIComponent(name ?? "").trim() || t("library.unknownArtist")
    } catch {
      return (name ?? "").trim() || t("library.unknownArtist")
    }
  }, [name, t])

  const normalizedArtistName = artistName.toLowerCase()
  const { data: dbTracks = [], isLoading: isArtistTracksLoading } = useTracks()

  const allPlayerTracks = React.useMemo(
    () => dbTracks.map((track) => toPlayerTrack(track, splitMultipleValueConfig)!),
    [dbTracks, splitMultipleValueConfig]
  )

  const artistTracks = React.useMemo(
    () =>
      allPlayerTracks.filter((track) =>
        trackMatchesArtistName(track, normalizedArtistName, splitMultipleValueConfig)
      ),
    [allPlayerTracks, normalizedArtistName, splitMultipleValueConfig]
  )
  const { data: artistRecord } = useArtistByName(artistName)
  const artistId = artistRecord?.id
  const isLoading = isArtistTracksLoading && artistTracks.length === 0

  const { albumArtistTracks, featuredOnTracks } = React.useMemo(() => {
    const primary: PlayerTrack[] = []
    const featured: PlayerTrack[] = []
    for (const track of artistTracks) {
      const primaryArtist = track.albumArtist || track.artist
      const matchesPrimary = trackMatchesArtistName(
        { ...track, artist: primaryArtist, albumArtist: primaryArtist },
        normalizedArtistName,
        splitMultipleValueConfig
      )
      if (matchesPrimary) {
        primary.push(track)
      } else {
        featured.push(track)
      }
    }
    return { albumArtistTracks: primary, featuredOnTracks: featured }
  }, [artistTracks, normalizedArtistName, splitMultipleValueConfig])

  const sortedArtistTracks = React.useMemo(
    () => sortPlayerTracks(artistTracks, allSortConfigs.ArtistTracks ?? { field: "title", order: "asc" }),
    [artistTracks, allSortConfigs.ArtistTracks]
  )
  const sortedAlbums = React.useMemo(
    () =>
      sortAlbums(
        buildAlbumGridItems(buildArtistAlbums(albumArtistTracks), t("library.unknownArtist")),
        allSortConfigs.ArtistAlbums ?? { field: "year", order: "desc" }
      ),
    [albumArtistTracks, allSortConfigs.ArtistAlbums, t]
  )
  const sortedFeaturedOnAlbums = React.useMemo(
    () =>
      sortAlbums(
        buildAlbumGridItems(buildArtistAlbums(featuredOnTracks), t("library.unknownArtist")),
        allSortConfigs.ArtistAlbums ?? { field: "year", order: "desc" }
      ),
    [featuredOnTracks, allSortConfigs.ArtistAlbums, t]
  )

  const currentTab =
    activeView === "tracks"
      ? "ArtistTracks"
      : activeView === "albums" || activeView === "featuredOn"
        ? "ArtistAlbums"
        : "ArtistTracks"
  const sortConfig: DetailSortConfig =
    allSortConfigs[currentTab] ?? { field: "title", order: "asc" }

  return {
    artistName,
    artistId,
    artistImage: artistRecord?.artwork || undefined,
    artistBio: artistRecord?.bio || undefined,
    artistTransitionId: resolveArtistTransitionId({
      transitionId,
      id: artistId,
      name: artistName,
    }),
    artistTracks,
    sortedArtistTracks,
    popularTracks: sortedArtistTracks.slice(0, 5),
    sortedAlbums,
    sortedFeaturedOnAlbums,
    hasAlbumSections: sortedAlbums.length > 0 || sortedFeaturedOnAlbums.length > 0,
    isLoading,
    sortConfig,
    currentTab,
  }
}
