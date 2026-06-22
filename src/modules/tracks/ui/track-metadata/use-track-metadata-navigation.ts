import { useState } from "react"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import type { ArtistPickerSheetItem } from "@/components/blocks/artist-picker-sheet"
import { resolveAlbumTransitionId } from "@/modules/artists/artist-transition"
import { buildArtistSelectionItems, dedupeValues, type FullTrackData } from "./metadata-derivation"

export function useTrackMetadataNavigation({
  trackAlbumId,
  fullTrackData,
  buildArtistPickerItems,
  trackCountLabel,
  onSheetClose,
}: {
  trackAlbumId?: string
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
  onSheetClose: () => void
}) {
  const router = useRouter()
  const [artistSelectionItems, setArtistSelectionItems] = useState<ArtistPickerSheetItem[]>([])
  const [genreSelectionValues, setGenreSelectionValues] = useState<string[]>([])
  const [isArtistSelectionOpen, setIsArtistSelectionOpen] = useState(false)
  const [isGenreSelectionOpen, setIsGenreSelectionOpen] = useState(false)

  const handleOpenArtist = (artistName: string) => {
    const normalizedArtistName = artistName.trim()
    if (!normalizedArtistName) {
      return
    }

    setIsArtistSelectionOpen(false)
    router.push({
      pathname: "/artist/[name]",
      params: { name: normalizedArtistName },
    })
    onSheetClose()
  }

  const handleOpenAlbum = (albumName: string) => {
    const normalizedAlbumName = albumName.trim()
    if (!normalizedAlbumName) {
      return
    }

    router.push({
      pathname: "/album/[name]",
      params: {
        name: normalizedAlbumName,
        transitionId: resolveAlbumTransitionId({
          id: trackAlbumId,
          title: normalizedAlbumName,
        }),
      },
    })
    onSheetClose()
  }

  const handleOpenGenre = (genreName: string) => {
    const normalizedGenreName = genreName.trim()
    if (!normalizedGenreName) {
      return
    }

    setIsGenreSelectionOpen(false)
    router.push({
      pathname: "/genre/[name]",
      params: { name: normalizedGenreName },
    })
    onSheetClose()
  }

  const handleOpenArtistSelection = (values: string[]) => {
    const normalized = dedupeValues(
      values.map((value) => value.trim()).filter((value) => value.length > 0)
    )
    if (normalized.length === 0) {
      return
    }

    if (normalized.length === 1) {
      handleOpenArtist(normalized[0] || "")
      return
    }

    const items = buildArtistSelectionItems({
      artistNames: normalized,
      fullTrackData,
      buildArtistPickerItems,
      trackCountLabel,
    })

    setArtistSelectionItems(items)
    setIsArtistSelectionOpen(true)
  }

  const handleOpenGenreSelection = (values: string[]) => {
    const normalized = dedupeValues(
      values.map((value) => value.trim()).filter((value) => value.length > 0)
    )
    if (normalized.length === 0) {
      return
    }

    if (normalized.length === 1) {
      handleOpenGenre(normalized[0] || "")
      return
    }

    setGenreSelectionValues(normalized)
    setIsGenreSelectionOpen(true)
  }

  return {
    artistSelectionItems,
    genreSelectionValues,
    isArtistSelectionOpen,
    isGenreSelectionOpen,
    setIsArtistSelectionOpen,
    setIsGenreSelectionOpen,
    handleOpenArtist,
    handleOpenAlbum,
    handleOpenGenre,
    handleOpenArtistSelection,
    handleOpenGenreSelection,
  }
}
