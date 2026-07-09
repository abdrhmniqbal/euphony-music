/**
 * Purpose: Owns data resolution, action orchestration, and sub-sheet state for TrackActionSheet.
 * Data: artist name dedupe, album name resolution, favorite override, sub-sheet toggles.
 * Actions: favorite, play next, add to queue, playlist add/remove, delete dialog, navigation.
 * Sub-sheets: playlists, delete dialog, artist picker, metadata.
 */

import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { buildArtistPickerItems } from "@/modules/library/artist-picker-utils"
import { useToggleFavorite } from "@/modules/favorites/mutations"
import { useIsFavorite } from "@/modules/favorites/queries"
import { addToQueue, queueTrackNext } from "@/modules/player/queue"
import { useRemoveTrackFromPlaylist } from "@/modules/playlist/mutations"
import { usePlaylistPickerSelection } from "@/modules/playlist/use-picker-selection"
import { useTrack } from "@/modules/tracks/queries"
import { useSettingsStore } from "@/modules/settings/store"
import { splitArtistsValue } from "@/modules/settings/split-multiple-values"
import { resolveAlbumTransitionId } from "@/modules/artists/artist-transition"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { showAppToast } from "@/modules/ui/toast"
import type { Track } from "@/modules/player/types"
import type { ValueNavigationSheetItem } from "@/modules/library/ui/value-navigation-sheet"

interface UseTrackActionsOptions {
  track: Track | null
  playlistId?: string
  onClose: () => void
  onAddToPlaylist?: (track: Track) => void
}

export function useTrackActions({
  track,
  playlistId,
  onClose,
  onAddToPlaylist,
}: UseTrackActionsOptions) {
  const router = useRouter()
  const { t } = useTranslation()
  const toggleFavoriteMutation = useToggleFavorite()
  const removeTrackFromPlaylistMutation = useRemoveTrackFromPlaylist()

  const [isPlaylistPickerOpen, setIsPlaylistPickerOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({})
  const [isMetadataSheetOpen, setIsMetadataSheetOpen] = useState(false)
  const [isArtistSelectionOpen, setIsArtistSelectionOpen] = useState(false)
  const [artistSelectionItems, setArtistSelectionItems] = useState<ValueNavigationSheetItem[]>([])

  const favoriteTrackId = track?.id || ""
  const { data: isFavoriteData = track?.isFavorite ?? false } = useIsFavorite(
    "track",
    favoriteTrackId
  )
  const isFavorite = track ? (favoriteOverrides[track.id] ?? Boolean(isFavoriteData)) : false
  const { data: fullTrackData } = useTrack(track?.id ?? "")
  const splitMultipleValueConfig = useSettingsStore((state) => state.splitMultipleValueConfig)

  const handleToggleFavorite = useCallback(() => {
    if (track) {
      const newState = !isFavorite
      setFavoriteOverrides((prev) => ({ ...prev, [track.id]: newState }))
      void toggleFavoriteMutation.mutateAsync({
        type: "track",
        itemId: track.id,
        isCurrentlyFavorite: isFavorite,
        name: track.title,
        subtitle: track.artist,
        image: track.image,
      })
    }
  }, [track, isFavorite, toggleFavoriteMutation])

  const handlePlayNext = useCallback(async () => {
    if (track) {
      await queueTrackNext(track)
      onClose()
    }
  }, [track, onClose])

  const handleAddToQueue = useCallback(async () => {
    if (track) {
      await addToQueue(track)
      onClose()
    }
  }, [track, onClose])

  const handleAddToPlaylist = useCallback(() => {
    if (!track) {
      return
    }
    if (onAddToPlaylist) {
      onAddToPlaylist(track)
      onClose()
      return
    }
    setIsPlaylistPickerOpen(true)
  }, [track, onAddToPlaylist, onClose])

  const handleRemoveFromPlaylist = useCallback(async () => {
    if (!track || !playlistId) {
      return
    }
    await removeTrackFromPlaylistMutation.mutateAsync({
      playlistId,
      trackId: track.id,
    })
    onClose()
  }, [track, playlistId, removeTrackFromPlaylistMutation, onClose])

  const handleOpenDeleteDialog = useCallback(() => {
    if (!track) {
      return
    }
    setIsPlaylistPickerOpen(false)
    setIsDeleteDialogOpen(true)
    onClose()
  }, [track, onClose])

  const showPlaylistToast = useCallback((title: string, description?: string) => {
    showAppToast(title, description)
  }, [])

  const { isSelecting, handleSelectPlaylist } = usePlaylistPickerSelection({
    trackId: track?.id,
    onSelectionApplied: useCallback(() => {
      setIsPlaylistPickerOpen(false)
      onClose()
    }, [onClose]),
    showPlaylistToast,
  })

  const handleCreatePlaylist = useCallback(() => {
    setIsPlaylistPickerOpen(false)
    onClose()
    router.push("/playlist/form")
  }, [router, onClose])

  const handleOpenArtist = useCallback(
    (artistName: string) => {
      const normalized = artistName.trim()
      if (!normalized) {
        return
      }
      setIsArtistSelectionOpen(false)
      router.push({
        pathname: "/artist/[name]",
        params: { name: normalized },
      })
      onClose()
    },
    [router, onClose]
  )

  const handleOpenAlbum = useCallback(
    (albumName: string) => {
      const normalized = albumName.trim()
      if (!normalized) {
        return
      }
      router.push({
        pathname: "/album/[name]",
        params: {
          name: normalized,
          transitionId: resolveAlbumTransitionId({
            id: track?.albumId,
            title: normalized,
          }),
        },
      })
      onClose()
    },
    [router, track?.albumId, onClose]
  )

  const dedupeValues = useCallback((values: string[]) => {
    const seen = new Set<string>()
    return values.filter((value) => {
      const key = value.toLowerCase()
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }, [])

  const artistNames = (() => {
    const relationNames = [
      fullTrackData?.artist?.name?.trim(),
      ...(fullTrackData?.featuredArtists?.map((entry) => entry.artist?.name?.trim()) ?? []),
    ].filter((value): value is string => Boolean(value))
    if (relationNames.length > 0) {
      return dedupeValues(relationNames)
    }
    const fallbackNames = splitArtistsValue(track?.artist, splitMultipleValueConfig)
    return fallbackNames.length > 0 ? dedupeValues(fallbackNames) : []
  })()

  const albumNames = (() => {
    const relationAlbumName = fullTrackData?.album?.title?.trim()
    if (relationAlbumName) {
      return [relationAlbumName]
    }
    const fallbackAlbumName = track?.album?.trim()
    return fallbackAlbumName ? [fallbackAlbumName] : []
  })()

  const handleOpenArtistSelection = useCallback(() => {
    const normalized = dedupeValues(
      artistNames.map((value) => value.trim()).filter((value) => value.length > 0)
    )
    if (normalized.length === 0) {
      return
    }
    if (normalized.length === 1) {
      handleOpenArtist(normalized[0] || "")
      return
    }
    const richArtistItems = buildArtistPickerItems(
      {
        artwork: fullTrackData?.artwork,
        albumArtwork: fullTrackData?.album?.artwork,
        artist: fullTrackData?.artist,
        featuredArtists: fullTrackData?.featuredArtists,
      },
      normalized,
      (count) => t("library.count.track", { count })
    )
    setArtistSelectionItems(
      richArtistItems.length > 0 ? richArtistItems : normalized.map((value) => ({ value }))
    )
    setIsArtistSelectionOpen(true)
  }, [artistNames, dedupeValues, fullTrackData, handleOpenArtist, t])

  return {
    isFavorite,
    artistNames,
    albumNames,
    isPlaylistPickerOpen,
    setIsPlaylistPickerOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isArtistSelectionOpen,
    setIsArtistSelectionOpen,
    isMetadataSheetOpen,
    setIsMetadataSheetOpen,
    artistSelectionItems,
    setArtistSelectionItems,
    isSelecting,
    handleToggleFavorite,
    handlePlayNext,
    handleAddToQueue,
    handleAddToPlaylist,
    handleRemoveFromPlaylist,
    handleOpenDeleteDialog,
    handleOpenArtistSelection,
    handleOpenAlbum,
    handleCreatePlaylist,
    handleOpenArtist,
    handleSelectPlaylist,
  }
}
