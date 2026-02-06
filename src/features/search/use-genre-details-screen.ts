import { useEffect, useState } from 'react';
import { startIndexing } from '@/features/indexer';
import type { Track } from '@/features/player/player.types';
import { fetchGenreDetails, getPreviewAlbums, type GenreAlbumInfo } from '@/features/search/search.service';

export function useGenreDetailsScreen(genreName: string) {
  const [topSongs, setTopSongs] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<GenreAlbumInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setIsLoading(true);

      try {
        const data = await fetchGenreDetails(genreName);
        if (!isActive) {
          return;
        }

        setTopSongs(data.topSongs);
        setAlbums(data.albums);
      } catch {
        if (isActive) {
          setTopSongs([]);
          setAlbums([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isActive = false;
    };
  }, [genreName]);

  async function refresh() {
    startIndexing(true);
    setIsLoading(true);

    try {
      const data = await fetchGenreDetails(genreName);
      setTopSongs(data.topSongs);
      setAlbums(data.albums);
    } catch {
      setTopSongs([]);
      setAlbums([]);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    topSongs,
    albums,
    previewAlbums: getPreviewAlbums(albums),
    isLoading,
    refresh,
  };
}
