import {
  useIsFavorite,
  useToggleFavorite,
} from "@/modules/favorites/favorites.queries"
import { playTrack } from "@/modules/player/player.store"
import {
  useDeletePlaylist,
  usePlaylist,
} from "@/modules/playlist/playlist.queries"
import {
  buildPlaylistImages,
  buildPlaylistTracks,
  getPlaylistDuration,
} from "@/modules/playlist/playlist.utils"

export function usePlaylistDetailsScreen(id: string) {
  const { data: playlist, isLoading } = usePlaylist(id)
  const { data: isFavoriteData = false } = useIsFavorite("playlist", id)
  const toggleFavoriteMutation = useToggleFavorite()
  const deletePlaylistMutation = useDeletePlaylist()
  const isFavorite = Boolean(isFavoriteData)

  const tracks = buildPlaylistTracks(playlist)
  const playlistImages = buildPlaylistImages(playlist, tracks)
  const totalDuration = getPlaylistDuration(tracks)

  function playFromPlaylist(trackId: string) {
    const selectedTrack = tracks.find((track) => track.id === trackId)
    if (selectedTrack) {
      playTrack(selectedTrack, tracks)
    }
  }

  function playAll() {
    if (tracks.length === 0) {
      return
    }

    playTrack(tracks[0], tracks)
  }

  function shuffle() {
    if (tracks.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * tracks.length)
    playTrack(tracks[randomIndex], tracks)
  }

  async function toggleFavorite() {
    if (!playlist) {
      return
    }

    await toggleFavoriteMutation.mutateAsync({
      type: "playlist",
      itemId: playlist.id,
      isCurrentlyFavorite: isFavorite,
    })
  }

  async function deletePlaylist(): Promise<boolean> {
    if (!playlist) {
      return false
    }

    try {
      await deletePlaylistMutation.mutateAsync(playlist.id)
      return true
    } catch {
      return false
    }
  }

  return {
    playlist,
    tracks,
    playlistImages,
    totalDuration,
    isLoading,
    isFavorite,
    playFromPlaylist,
    playAll,
    shuffle,
    toggleFavorite,
    deletePlaylist,
    isDeleting: deletePlaylistMutation.isPending,
  }
}
