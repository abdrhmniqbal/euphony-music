import { usePlaylist } from '@/features/library/api/use-library';
import { useIsFavorite, toggleFavoriteItem } from '@/features/favorites/favorites.store';
import { playTrack } from '@/features/player/player.store';
import { buildPlaylistImages, buildPlaylistTracks, getPlaylistDuration } from '@/features/library/playlist-details.service';

export function usePlaylistDetailsScreen(id: string) {
  const { data: playlist, isLoading } = usePlaylist(id);
  const isFavorite = useIsFavorite(id, 'playlist');

  const tracks = buildPlaylistTracks(playlist);
  const playlistImages = buildPlaylistImages(playlist, tracks);
  const totalDuration = getPlaylistDuration(tracks);

  function playFromPlaylist(trackId: string) {
    const selectedTrack = tracks.find((track) => track.id === trackId);
    if (selectedTrack) {
      playTrack(selectedTrack, tracks);
    }
  }

  function playAll() {
    if (tracks.length === 0) {
      return;
    }

    playTrack(tracks[0], tracks);
  }

  function shuffle() {
    if (tracks.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * tracks.length);
    playTrack(tracks[randomIndex], tracks);
  }

  async function toggleFavorite() {
    if (!playlist) {
      return;
    }

    await toggleFavoriteItem(
      playlist.id,
      'playlist',
      playlist.name,
      `${tracks.length} songs`,
      playlist.artwork || (tracks.length > 0 ? tracks[0].image : undefined),
    );
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
  };
}
