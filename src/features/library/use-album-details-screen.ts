import { useLocalSearchParams } from 'expo-router';
import { useStore } from '@nanostores/react';
import { useIsFavorite } from '@/features/favorites/favorites.store';
import { $tracks, playTrack, type Track } from '@/features/player/player.store';
import {
  $sortConfig,
  setSortConfig,
  SONG_SORT_OPTIONS,
  sortTracks,
  type SortField,
} from '@/features/library/library-sort.store';
import {
  formatAlbumDuration,
  groupTracksByDisc,
  sortTracksByDiscAndTrack,
} from '@/features/library/album-details.service';

export function useAlbumDetailsScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const tracks = useStore($tracks);
  const allSortConfigs = useStore($sortConfig);

  const albumName = decodeURIComponent(name || '');

  const albumTracks = tracks.filter(
    (track) => track.album?.toLowerCase() === albumName.toLowerCase(),
  );

  const albumInfo = (() => {
    if (albumTracks.length === 0) {
      return null;
    }

    const firstTrack = albumTracks[0];
    return {
      title: firstTrack.album || 'Unknown Album',
      artist: firstTrack.albumArtist || firstTrack.artist || 'Unknown Artist',
      image: firstTrack.image,
      year: firstTrack.year,
    };
  })();

  const totalDuration = albumTracks.reduce((sum, track) => sum + (track.duration || 0), 0);
  const sortConfig = allSortConfigs.AlbumSongs || { field: 'title' as SortField, order: 'asc' as const };

  const sortedTracks =
    sortConfig.field !== 'title' || sortConfig.order !== 'asc'
      ? sortTracks(albumTracks, sortConfig)
      : sortTracksByDiscAndTrack(albumTracks);

  const tracksByDisc = groupTracksByDisc(sortedTracks);
  const albumId = albumTracks[0]?.albumId;
  const isAlbumFavorite = useIsFavorite(albumId || '', 'album');

  function playSelectedTrack(track: Track) {
    playTrack(track, sortedTracks);
  }

  function playAllTracks() {
    if (sortedTracks.length > 0) {
      playTrack(sortedTracks[0], sortedTracks);
    }
  }

  function shuffleTracks() {
    if (sortedTracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * sortedTracks.length);
      playTrack(sortedTracks[randomIndex], sortedTracks);
    }
  }

  function selectSort(field: SortField, order?: 'asc' | 'desc') {
    setSortConfig('AlbumSongs', field, order);
  }

  function getSortLabel() {
    const option = SONG_SORT_OPTIONS.find((item) => item.field === sortConfig.field);
    return option?.label || 'Sort';
  }

  return {
    albumInfo,
    albumId,
    isAlbumFavorite,
    tracksByDisc,
    sortedTracks,
    sortConfig,
    totalDurationLabel: formatAlbumDuration(totalDuration),
    playSelectedTrack,
    playAllTracks,
    shuffleTracks,
    selectSort,
    getSortLabel,
  };
}
