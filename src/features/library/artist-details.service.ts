import type { Track } from '@/features/player/player.types';

export interface ArtistAlbum {
  title: string;
  artist?: string;
  albumArtist?: string;
  image?: string;
  year?: number;
  trackCount: number;
}

export function buildArtistAlbums(artistTracks: Track[]): ArtistAlbum[] {
  const albumMap = new Map<string, ArtistAlbum>();

  artistTracks.forEach((track) => {
    const albumName = track.album || 'Unknown Album';
    const existing = albumMap.get(albumName);

    if (existing) {
      existing.trackCount += 1;
      return;
    }

    albumMap.set(albumName, {
      title: albumName,
      artist: track.artist,
      albumArtist: track.albumArtist,
      image: track.image,
      year: track.year,
      trackCount: 1,
    });
  });

  return Array.from(albumMap.values());
}
