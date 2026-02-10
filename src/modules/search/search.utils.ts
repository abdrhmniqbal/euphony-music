import {
  getAlbumsByGenre,
  getAllGenres,
  getAllTracksByGenre,
  getTopTracksByGenre,
  type GenreAlbumInfo as AlbumInfo,
} from '@/modules/genres/genres.api';
import type { Track } from '@/modules/player/player.types';
import type { Album } from '@/components/blocks/album-grid';

export type PatternType = 'circles' | 'waves' | 'grid' | 'diamonds' | 'triangles' | 'rings' | 'pills';

export interface Category {
  id: string;
  title: string;
  color: string;
  pattern: PatternType;
}
export type GenreAlbumInfo = AlbumInfo;

const RAINBOW_COLORS = [
  'bg-rainbow-lime',
  'bg-rainbow-teal',
  'bg-rainbow-cyan',
  'bg-rainbow-blue',
  'bg-rainbow-indigo',
  'bg-rainbow-purple',
  'bg-rainbow-magenta',
  'bg-rainbow-red',
  'bg-rainbow-orange',
  'bg-rainbow-amber',
] as const;

const PATTERNS: PatternType[] = ['circles', 'waves', 'diamonds', 'triangles', 'rings', 'grid', 'pills'];

export async function fetchGenres(): Promise<string[]> {
  return getAllGenres();
}

export function mapGenresToCategories(genres: string[]): Category[] {
  return genres.map((genre, index) => ({
    id: genre,
    title: genre,
    color: RAINBOW_COLORS[index % RAINBOW_COLORS.length],
    pattern: PATTERNS[index % PATTERNS.length],
  }));
}

export async function fetchGenreDetails(genreName: string): Promise<{ topTracks: Track[]; albums: AlbumInfo[] }> {
  const [topTracks, albums] = await Promise.all([
    getTopTracksByGenre(genreName, 25),
    getAlbumsByGenre(genreName),
  ]);

  return { topTracks, albums };
}

export async function fetchGenreTopTracks(genreName: string): Promise<Track[]> {
  return getAllTracksByGenre(genreName);
}

export async function fetchGenreAlbums(genreName: string): Promise<AlbumInfo[]> {
  return getAlbumsByGenre(genreName);
}

export function getPreviewAlbums(albums: AlbumInfo[], limit = 8): AlbumInfo[] {
  return [...albums].sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, limit);
}

export function mapAlbumsToGridData(albums: AlbumInfo[]): Album[] {
  return [...albums]
    .sort((a, b) => (b.year || 0) - (a.year || 0))
    .map((album, index) => ({
      id: `${album.name}-${index}`,
      title: album.name,
      artist: album.artist || 'Unknown Artist',
      albumArtist: album.artist,
      image: album.image,
      trackCount: album.trackCount,
      year: album.year || 0,
      dateAdded: 0,
    }));
}
