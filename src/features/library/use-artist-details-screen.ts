import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '@nanostores/react';
import { useIsFavorite } from '@/features/favorites/favorites.store';
import { $tracks, playTrack, type Track } from '@/features/player/player.store';
import {
  $sortConfig,
  ALBUM_SORT_OPTIONS,
  SONG_SORT_OPTIONS,
  setSortConfig,
  sortAlbums,
  sortTracks,
  type SortField,
} from '@/features/library/library-sort.store';
import { type Album } from '@/components/library/album-grid';
import { buildArtistAlbums } from '@/features/library/artist-details.service';

export function useArtistDetailsScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();

  const tracks = useStore($tracks);
  const allSortConfigs = useStore($sortConfig);

  const artistTracks = tracks.filter((track) => track.artist?.toLowerCase() === name?.toLowerCase());
  const artistId = artistTracks[0]?.artistId;
  const artistImage = artistTracks.find((track) => track.image)?.image;
  const isArtistFavorite = useIsFavorite(artistId || '', 'artist');

  const albums = buildArtistAlbums(artistTracks);
  const sortedArtistTracks = sortTracks(artistTracks, allSortConfigs.ArtistSongs);
  const popularTracks = sortedArtistTracks.slice(0, 5);

  const sortedAlbums = sortAlbums(
    albums.map((album) => ({ ...album, id: album.title } as Album)),
    allSortConfigs.ArtistAlbums,
  );

  const [activeView, setActiveView] = useState<'overview' | 'songs' | 'albums'>('overview');
  const [navDirection, setNavDirection] = useState<'forward' | 'back'>('forward');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const currentTab = activeView === 'songs' ? 'ArtistSongs' : activeView === 'albums' ? 'ArtistAlbums' : 'ArtistSongs';
  const sortConfig = allSortConfigs[currentTab];

  function navigateTo(view: 'overview' | 'songs' | 'albums') {
    if (view === 'overview') {
      setNavDirection('back');
    } else {
      setNavDirection('forward');
    }

    setActiveView(view);
  }

  function playArtistTrack(track: Track) {
    playTrack(track, sortedArtistTracks);
  }

  function playAllTracks() {
    if (artistTracks.length > 0) {
      playTrack(artistTracks[0], sortedArtistTracks);
    }
  }

  function shuffleTracks() {
    if (artistTracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * artistTracks.length);
      playTrack(artistTracks[randomIndex], sortedArtistTracks);
    }
  }

  function openAlbum(album: Album) {
    router.push(`../album/${encodeURIComponent(album.title)}`);
  }

  function selectSort(field: SortField, order?: 'asc' | 'desc') {
    setSortConfig(currentTab, field, order);
  }

  function getSortLabel() {
    const options = activeView === 'songs' ? SONG_SORT_OPTIONS : ALBUM_SORT_OPTIONS;
    return options.find((option) => option.field === sortConfig.field)?.label || 'Sort';
  }

  return {
    name,
    artistTracks,
    artistId,
    artistImage,
    isArtistFavorite,
    albums,
    sortedArtistTracks,
    popularTracks,
    sortedAlbums,
    activeView,
    navDirection,
    sortModalVisible,
    setSortModalVisible,
    sortConfig,
    navigateTo,
    playArtistTrack,
    playAllTracks,
    shuffleTracks,
    openAlbum,
    selectSort,
    getSortLabel,
  };
}
