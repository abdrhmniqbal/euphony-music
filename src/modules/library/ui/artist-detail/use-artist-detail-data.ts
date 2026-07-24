import type { Album } from "@/modules/library/ui/album-grid"
import type { Track } from "@/modules/player/store"
import * as React from "react"
import { useLocalSearchParams } from "expo-router"
import { useTranslation } from "react-i18next"
import { resolveArtistTransitionId } from "@/modules/artists/artist-transition"
import { buildArtistAlbums } from "@/modules/artists/utils"
import { useLibrarySortStore } from "@/modules/library/sort-store"
import { sortAlbums, sortTracks } from "@/modules/library/sort-utils"
import { useArtistByName, useTracksByArtistName } from "@/modules/library/queries"
import { usePlayerTracks } from "@/modules/player/selectors"
import {
  type SplitMultipleValueConfig,
  splitArtistsValue,
} from "@/modules/settings/split-multiple-values"
import { useSettingsStore } from "@/modules/settings/store"
import { getSafeRouteName } from "@/modules/navigation"
import { scheduleRouteWarning } from "@/modules/navigation"

export function trackMatchesArtistName(
  track: Track,
  normalizedArtistName: string,
  splitMultipleValueConfig: SplitMultipleValueConfig
) {
  const candidateValues = [track.artist, track.albumArtist]
  return candidateValues.some((value) =>
    splitArtistsValue(value, splitMultipleValueConfig).some(
      (artist) => artist.trim().toLowerCase() === normalizedArtistName
    )
  )
}

function mergeArtistTracks(primary: Track[], fallback: Track[]) {
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
  const splitMultipleValueConfig = useSettingsStore((state) => state.splitMultipleValueConfig)
  const allSortConfigs = useLibrarySortStore((state) => state.sortConfig)
  const allTracks = usePlayerTracks()
  const parsedArtistRouteName = React.useMemo(() => getSafeRouteName(name), [name])
  const artistName = parsedArtistRouteName.value.trim() || t("library.unknownArtist")

  scheduleRouteWarning({
    key: "artist-details:missing-name",
    message: "Artist details route missing name param",
    metadata: { route: "/artist/[name]" },
    enabled: !parsedArtistRouteName.value.trim(),
  })
  scheduleRouteWarning({
    key: `artist-details:decode-failed:${parsedArtistRouteName.raw}`,
    message: "Artist details route name decode failed",
    metadata: { route: "/artist/[name]", rawName: parsedArtistRouteName.raw },
    enabled: parsedArtistRouteName.decodeFailed,
  })

  const normalizedArtistName = artistName.toLowerCase()
  const {
    data: artistTracksFromQuery = [],
    isLoading: isArtistTracksLoading,
  } = useTracksByArtistName(artistName)
  const fallbackArtistTracks = allTracks.filter((track) =>
    trackMatchesArtistName(track, normalizedArtistName, splitMultipleValueConfig)
  )
  const artistTracks = mergeArtistTracks(artistTracksFromQuery, fallbackArtistTracks)
  const { data: artistRecord } = useArtistByName(artistName)
  const artistId = artistRecord?.id
  const isLoading = isArtistTracksLoading && artistTracks.length === 0

  const albumArtistTracks = artistTracks.filter((track) => {
    const primaryArtist = track.albumArtist || track.artist
    return trackMatchesArtistName(
      { ...track, artist: primaryArtist, albumArtist: primaryArtist },
      normalizedArtistName,
      splitMultipleValueConfig
    )
  })
  const featuredOnTracks = artistTracks.filter((track) => {
    const primaryArtist = track.albumArtist || track.artist
    return !trackMatchesArtistName(
      { ...track, artist: primaryArtist, albumArtist: primaryArtist },
      normalizedArtistName,
      splitMultipleValueConfig
    )
  })

  const albums = buildArtistAlbums(albumArtistTracks)
  const featuredOnAlbums = buildArtistAlbums(featuredOnTracks)
  const sortedArtistTracks = sortTracks(artistTracks, allSortConfigs.ArtistTracks)
  const sortedAlbums = sortAlbums(
    buildAlbumGridItems(albums, t("library.unknownArtist")),
    allSortConfigs.ArtistAlbums
  )
  const sortedFeaturedOnAlbums = sortAlbums(
    buildAlbumGridItems(featuredOnAlbums, t("library.unknownArtist")),
    allSortConfigs.ArtistAlbums
  )

  const currentTab =
    activeView === "tracks"
      ? "ArtistTracks"
      : activeView === "albums" || activeView === "featuredOn"
        ? "ArtistAlbums"
        : "ArtistTracks"
  const sortConfig = allSortConfigs[currentTab]

  return {
    artistName,
    artistId,
    artistImage: artistRecord?.artwork || undefined,
    artistBio: artistRecord?.bio,
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


