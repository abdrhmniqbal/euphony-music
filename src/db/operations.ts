import { db } from "@/db/client";
import { tracks, playHistory, artists, albums, playlists } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import type { Track } from "@/store/player-store";

// Play History Operations
export async function addToHistory(trackId: string): Promise<void> {
  try {
    await db.insert(playHistory).values({
      id: `${trackId}-${Date.now()}`,
      trackId,
      playedAt: Date.now(),
      duration: 0,
      completed: 0,
    });

    // Keep only last 50 entries
    const allHistory = await db.query.playHistory.findMany({
      orderBy: [desc(playHistory.playedAt)],
    });

    if (allHistory.length > 50) {
      const toDelete = allHistory.slice(50);
      for (const entry of toDelete) {
        await db.delete(playHistory).where(eq(playHistory.id, entry.id));
      }
    }
  } catch (e) {
    console.warn('Failed to add to history:', e);
  }
}

export async function incrementPlayCount(trackId: string): Promise<void> {
  try {
    await db
      .update(tracks)
      .set({
        playCount: sql`${tracks.playCount} + 1`,
        lastPlayedAt: Date.now(),
      })
      .where(eq(tracks.id, trackId));

    await addToHistory(trackId);
  } catch (e) {
    console.warn('Failed to increment play count:', e);
  }
}

// Favorites Operations
export type FavoriteType = 'track' | 'artist' | 'album' | 'playlist';

export interface FavoriteEntry {
  id: string;
  type: FavoriteType;
  name: string;
  subtitle?: string;
  image?: string;
  dateAdded: number;
}

// Helper to get the correct table for each entity type
function getTableForType(type: FavoriteType) {
  switch (type) {
    case 'track':
      return tracks;
    case 'artist':
      return artists;
    case 'album':
      return albums;
    case 'playlist':
      return playlists;
    default:
      throw new Error(`Unknown favorite type: ${type}`);
  }
}

export async function addFavorite(entry: FavoriteEntry): Promise<void> {
  try {
    const table = getTableForType(entry.type);
    const now = Date.now();

    await db
      .update(table)
      .set({
        isFavorite: 1,
        favoritedAt: now,
      } as any)
      .where(eq(table.id, entry.id));
  } catch (e) {
    console.warn('Failed to add favorite:', e);
  }
}

export async function removeFavorite(id: string, type: FavoriteType): Promise<void> {
  try {
    const table = getTableForType(type);

    await db
      .update(table)
      .set({
        isFavorite: 0,
        favoritedAt: null,
      } as any)
      .where(eq(table.id, id));
  } catch (e) {
    console.warn('Failed to remove favorite:', e);
  }
}

export async function isFavorite(id: string, type: FavoriteType): Promise<boolean> {
  try {
    let result: any = null;
    
    switch (type) {
      case 'track':
        result = await db.query.tracks.findFirst({
          where: and(eq(tracks.id, id), eq(tracks.isFavorite, 1)),
        });
        break;
      case 'artist':
        result = await db.query.artists.findFirst({
          where: and(eq(artists.id, id), eq(artists.isFavorite, 1)),
        });
        break;
      case 'album':
        result = await db.query.albums.findFirst({
          where: and(eq(albums.id, id), eq(albums.isFavorite, 1)),
        });
        break;
      case 'playlist':
        result = await db.query.playlists.findFirst({
          where: and(eq(playlists.id, id), eq(playlists.isFavorite, 1)),
        });
        break;
    }
    
    return !!result;
  } catch (e) {
    console.warn('Failed to check favorite:', e);
    return false;
  }
}

export async function getFavorites(type?: FavoriteType): Promise<FavoriteEntry[]> {
  try {
    const favorites: FavoriteEntry[] = [];

    // Query tracks
    if (!type || type === 'track') {
      const favTracks = await db.query.tracks.findMany({
        where: eq(tracks.isFavorite, 1),
        orderBy: [desc(tracks.favoritedAt)],
      });
      favorites.push(...favTracks.map((t) => ({
        id: t.id,
        type: 'track' as FavoriteType,
        name: t.title,
        subtitle: undefined,
        image: t.artwork || undefined,
        dateAdded: t.favoritedAt || Date.now(),
      })));
    }

    // Query artists
    if (!type || type === 'artist') {
      const favArtists = await db.query.artists.findMany({
        where: eq(artists.isFavorite, 1),
        orderBy: [desc(artists.favoritedAt)],
      });
      favorites.push(...favArtists.map((a) => ({
        id: a.id,
        type: 'artist' as FavoriteType,
        name: a.name,
        subtitle: `${a.trackCount} tracks`,
        image: a.artwork || undefined,
        dateAdded: a.favoritedAt || Date.now(),
      })));
    }

    // Query albums
    if (!type || type === 'album') {
      const favAlbums = await db.query.albums.findMany({
        where: eq(albums.isFavorite, 1),
        orderBy: [desc(albums.favoritedAt)],
      });
      favorites.push(...favAlbums.map((a) => ({
        id: a.id,
        type: 'album' as FavoriteType,
        name: a.title,
        subtitle: a.year?.toString() || undefined,
        image: a.artwork || undefined,
        dateAdded: a.favoritedAt || Date.now(),
      })));
    }

    // Query playlists
    if (!type || type === 'playlist') {
      const favPlaylists = await db.query.playlists.findMany({
        where: eq(playlists.isFavorite, 1),
        orderBy: [desc(playlists.favoritedAt)],
      });
      favorites.push(...favPlaylists.map((p) => ({
        id: p.id,
        type: 'playlist' as FavoriteType,
        name: p.name,
        subtitle: `${p.trackCount} tracks`,
        image: p.artwork || undefined,
        dateAdded: p.favoritedAt || Date.now(),
      })));
    }

    // Sort all favorites by date added (most recent first)
    favorites.sort((a, b) => b.dateAdded - a.dateAdded);

    return favorites;
  } catch (e) {
    console.warn('Failed to get favorites:', e);
    return [];
  }
}

export async function toggleFavoriteDB(trackId: string, isFavoriteValue: boolean): Promise<void> {
  try {
    if (isFavoriteValue) {
      // Add to favorites
      await db
        .update(tracks)
        .set({
          isFavorite: 1,
          favoritedAt: Date.now(),
        })
        .where(eq(tracks.id, trackId));
    } else {
      // Remove from favorites
      await db
        .update(tracks)
        .set({
          isFavorite: 0,
          favoritedAt: null,
        })
        .where(eq(tracks.id, trackId));
    }
  } catch (e) {
    console.warn('Failed to toggle favorite:', e);
  }
}

// Genre Operations
export async function getAllGenres(): Promise<string[]> {
  try {
    const result = await db.query.tracks.findMany({
      where: eq(tracks.isDeleted, 0),
    });

    // Extract unique genres
    const genres = new Set<string>();
    result.forEach((track: any) => {
      if (track.genre) {
        genres.add(track.genre);
      }
    });

    return Array.from(genres).sort();
  } catch (e) {
    console.warn('Failed to get all genres:', e);
    return [];
  }
}

export async function getTopSongsByGenre(genre: string, limit: number = 25): Promise<any[]> {
  try {
    const songs = await db.query.tracks.findMany({
      where: (t: any) => sql`${t.genre} = ${genre} AND ${t.isDeleted} = 0`,
      orderBy: [desc(tracks.playCount), desc(tracks.lastPlayedAt)],
      limit,
    });

    return songs.filter((t: any) => t.playCount && t.playCount > 0);
  } catch (e) {
    console.warn('Failed to get top songs by genre:', e);
    return [];
  }
}

export interface AlbumInfo {
  name: string;
  artist?: string;
  image?: string;
  trackCount: number;
}

export async function getAlbumsByGenre(genre: string): Promise<AlbumInfo[]> {
  try {
    const tracksInGenre = await db.query.tracks.findMany({
      where: (t: any) => sql`${t.genre} = ${genre} AND ${t.isDeleted} = 0 AND ${t.albumId} IS NOT NULL`,
    });

    // Group by album
    const albumMap = new Map<string, AlbumInfo>();

    for (const track of tracksInGenre as any[]) {
      if (track.albumId) {
        const albumName = track.album || 'Unknown Album';
        const key = `${albumName}-${track.artistId || ''}`;

        if (!albumMap.has(key)) {
          albumMap.set(key, {
            name: albumName,
            artist: track.artist,
            image: track.image,
            trackCount: 0,
          });
        }

        albumMap.get(key)!.trackCount++;
      }
    }

    return Array.from(albumMap.values()).sort((a, b) => b.trackCount - a.trackCount);
  } catch (e) {
    console.warn('Failed to get albums by genre:', e);
    return [];
  }
}

// History and Top Songs Operations
export async function getHistory(): Promise<Track[]> {
  try {
    const history = await db.query.playHistory.findMany({
      orderBy: [desc(playHistory.playedAt)],
      with: {
        track: {
          with: {
            artist: true,
            album: true,
          },
        },
      },
      limit: 50,
    });

    // Map to Track format and filter out deleted tracks
    return history
      .filter((h) => h.track && !h.track.isDeleted)
      .map((h) => ({
        id: h.track.id,
        title: h.track.title,
        artist: h.track.artist?.name,
        artistId: h.track.artistId || undefined,
        albumArtist: h.track.artist?.name,
        album: h.track.album?.title,
        albumId: h.track.albumId || undefined,
        duration: h.track.duration,
        uri: h.track.uri,
        image: h.track.artwork || undefined,
        playCount: h.track.playCount || 0,
        lastPlayedAt: h.track.lastPlayedAt || undefined,
        year: h.track.year || undefined,
        isFavorite: Boolean(h.track.isFavorite),
        trackNumber: h.track.trackNumber || undefined,
        discNumber: h.track.discNumber || undefined,
      }));
  } catch (e) {
    console.warn('Failed to get history:', e);
    return [];
  }
}

export async function getTopSongs(
  period: 'all' | 'day' | 'week' = 'all',
  limit: number = 25
): Promise<Track[]> {
  try {
    if (period === 'all') {
      // Get tracks sorted by play count with artist/album relations
      const topTracks = await db.query.tracks.findMany({
        where: eq(tracks.isDeleted, 0),
        orderBy: [desc(tracks.playCount), desc(tracks.lastPlayedAt)],
        with: {
          artist: true,
          album: true,
        },
        limit,
      });

      return topTracks
        .filter((t) => t.playCount && t.playCount > 0)
        .map((t) => ({
          id: t.id,
          title: t.title,
          artist: t.artist?.name,
          artistId: t.artistId || undefined,
          albumArtist: t.artist?.name,
          album: t.album?.title,
          albumId: t.albumId || undefined,
          duration: t.duration,
          uri: t.uri,
          image: t.artwork || undefined,
          playCount: t.playCount || 0,
          lastPlayedAt: t.lastPlayedAt || undefined,
          year: t.year || undefined,
          isFavorite: Boolean(t.isFavorite),
          trackNumber: t.trackNumber || undefined,
          discNumber: t.discNumber || undefined,
        }));
    } else {
      // Get tracks from history within time period
      const timeThreshold =
        period === 'day'
          ? Date.now() - 24 * 60 * 60 * 1000
          : Date.now() - 7 * 24 * 60 * 60 * 1000;

      const history = await db.query.playHistory.findMany({
        where: sql`${playHistory.playedAt} >= ${timeThreshold}`,
        with: {
          track: {
            with: {
              artist: true,
              album: true,
            },
          },
        },
      });

      // Count plays per track
      const trackCounts = new Map<string, { track: any; count: number }>();

      for (const entry of history) {
        if (entry.track && !entry.track.isDeleted) {
          const existing = trackCounts.get(entry.trackId);
          if (existing) {
            existing.count++;
          } else {
            trackCounts.set(entry.trackId, { track: entry.track, count: 1 });
          }
        }
      }

      // Sort by count and return top tracks
      return Array.from(trackCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map((item) => ({
          id: item.track.id,
          title: item.track.title,
          artist: item.track.artist?.name,
          artistId: item.track.artistId || undefined,
          albumArtist: item.track.artist?.name,
          album: item.track.album?.title,
          albumId: item.track.albumId || undefined,
          duration: item.track.duration,
          uri: item.track.uri,
          image: item.track.artwork || undefined,
          playCount: item.track.playCount || 0,
          lastPlayedAt: item.track.lastPlayedAt || undefined,
          year: item.track.year || undefined,
          isFavorite: Boolean(item.track.isFavorite),
          trackNumber: item.track.trackNumber || undefined,
          discNumber: item.track.discNumber || undefined,
        }));
    }
  } catch (e) {
    console.warn('Failed to get top songs:', e);
    return [];
  }
}
