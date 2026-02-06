import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useStore } from '@nanostores/react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { startIndexing, $indexerState } from '@/features/indexer';
import { useFavorites } from '@/features/favorites/favorites.store';
import { playTrack, $tracks, type Track } from '@/features/player/player.store';
import {
  $sortConfig,
  ALBUM_SORT_OPTIONS,
  ARTIST_SORT_OPTIONS,
  PLAYLIST_SORT_OPTIONS,
  SONG_SORT_OPTIONS,
  type SortField,
  setSortConfig,
} from '@/features/library/library-sort.store';
import { useAlbums, useArtists, usePlaylists } from '@/features/library/api/use-library';
import type { Folder } from '@/components/library/folder-list';
import type { Playlist } from '@/components/library/playlist-list';

export const LIBRARY_TABS = ['Songs', 'Albums', 'Artists', 'Playlists', 'Folders', 'Favorites'] as const;
export type LibraryTab = (typeof LIBRARY_TABS)[number];
type LibrarySortOption = { label: string; field: SortField };

export const LIBRARY_TAB_SORT_OPTIONS: Record<LibraryTab, LibrarySortOption[]> = {
  Songs: SONG_SORT_OPTIONS,
  Albums: ALBUM_SORT_OPTIONS,
  Artists: ARTIST_SORT_OPTIONS,
  Playlists: PLAYLIST_SORT_OPTIONS,
  Folders: [],
  Favorites: [],
};

export function useLibraryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LibraryTab>('Songs');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const indexerState = useStore($indexerState);
  const tracks = useStore($tracks);
  const allSortConfigs = useStore($sortConfig);
  const sortConfig = allSortConfigs[activeTab];
  const favorites = useFavorites();

  const { data: albumsData } = useAlbums();
  const { data: artistsData } = useArtists();
  const { data: playlistsData } = usePlaylists();

  const playlists: Playlist[] = playlistsData || [];
  const folders: Folder[] = [];

  function closeSortModal() {
    setSortModalVisible(false);
  }

  function navigateTab(direction: 'left' | 'right') {
    const currentIndex = LIBRARY_TABS.indexOf(activeTab);

    if (direction === 'left' && currentIndex < LIBRARY_TABS.length - 1) {
      setActiveTab(LIBRARY_TABS[currentIndex + 1]);
    } else if (direction === 'right' && currentIndex > 0) {
      setActiveTab(LIBRARY_TABS[currentIndex - 1]);
    }
  }

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onBegin((event) => {
      const currentIndex = LIBRARY_TABS.indexOf(activeTab);
      const isRightSwipe = event.translationX > 0;
      const isLeftSwipe = event.translationX < 0;

      if (isRightSwipe && currentIndex === 0) {
        return;
      }

      if (isLeftSwipe && currentIndex === LIBRARY_TABS.length - 1) {
        return;
      }
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > Math.abs(event.translationY)) {
        const currentIndex = LIBRARY_TABS.indexOf(activeTab);
        if (event.translationX > 50 && currentIndex > 0) {
          runOnJS(navigateTab)('right');
        } else if (event.translationX < -50 && currentIndex < LIBRARY_TABS.length - 1) {
          runOnJS(navigateTab)('left');
        }
      }
    });

  function refresh() {
    startIndexing(true);
  }

  function openArtist(name: string) {
    router.push(`./artist/${encodeURIComponent(name)}`);
  }

  function openAlbum(title: string) {
    router.push(`./album/${encodeURIComponent(title)}`);
  }

  function openPlaylist(id: string) {
    router.push(`./playlist/${id}`);
  }

  function openCreatePlaylist() {
    router.push('./playlist/create');
  }

  function playSingleTrack(track: Track) {
    playTrack(track);
  }

  function playAll() {
    if (activeTab === 'Favorites') {
      const firstTrack = favorites.find((favorite) => favorite.type === 'track');
      if (firstTrack) {
        const track = tracks.find((candidate) => candidate.id === firstTrack.id);
        if (track) {
          playTrack(track);
        }
      }
      return;
    }

    if (tracks.length > 0) {
      playTrack(tracks[0]);
    }
  }

  function shuffle() {
    if (activeTab === 'Favorites') {
      const trackFavorites = favorites.filter((favorite) => favorite.type === 'track');
      if (trackFavorites.length > 0) {
        const randomIndex = Math.floor(Math.random() * trackFavorites.length);
        const track = tracks.find((candidate) => candidate.id === trackFavorites[randomIndex].id);
        if (track) {
          playTrack(track);
        }
      }
      return;
    }

    if (tracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      playTrack(tracks[randomIndex]);
    }
  }

  function handleSortSelect(field: SortField, order?: 'asc' | 'desc') {
    setSortConfig(activeTab, field, order);
    if (!order) {
      setSortModalVisible(false);
    }
  }

  function getSortLabel() {
    const options = LIBRARY_TAB_SORT_OPTIONS[activeTab];
    const selected = options.find((option) => option.field === sortConfig.field);
    return selected?.label || 'Sort';
  }

  function getItemCount() {
    switch (activeTab) {
      case 'Songs':
        return tracks.length;
      case 'Albums':
        return albumsData?.length || 0;
      case 'Artists':
        return artistsData?.length || 0;
      case 'Favorites':
        return favorites.length;
      case 'Playlists':
        return playlists.length;
      case 'Folders':
        return folders.length;
      default:
        return 0;
    }
  }

  return {
    activeTab,
    setActiveTab,
    sortModalVisible,
    setSortModalVisible,
    closeSortModal,
    swipeGesture,
    indexerState,
    sortConfig,
    tracks,
    favorites,
    playlists,
    folders,
    refresh,
    openArtist,
    openAlbum,
    openPlaylist,
    openCreatePlaylist,
    playSingleTrack,
    playAll,
    shuffle,
    handleSortSelect,
    getSortLabel,
    getItemCount,
  };
}
