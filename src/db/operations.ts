import { db } from "@/db/client";
import { tracks, playHistory, favorites } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

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

export async function addFavorite(entry: FavoriteEntry): Promise<void> {
  try {
    const compositeId = `${entry.type}-${entry.id}`;
    await db.insert(favorites).values({
      id: compositeId,
      type: entry.type,
      itemId: entry.id,
      name: entry.name,
      subtitle: entry.subtitle || null,
      artwork: entry.image || null,
      createdAt: entry.dateAdded,
    });

    // Also update track table if it's a track
    if (entry.type === 'track') {
      await db
        .update(tracks)
        .set({ isFavorite: 1 })
        .where(eq(tracks.id, entry.id));
    }
  } catch (e) {
    console.warn('Failed to add favorite:', e);
  }
}

export async function removeFavorite(id: string): Promise<void> {
  try {
    // Check if it's a composite id (type-itemId) or just itemId
    const favorite = await db.query.favorites.findFirst({
      where: eq(favorites.id, id),
    });

    if (favorite) {
      await db.delete(favorites).where(eq(favorites.id, id));

      // Also update track table if it's a track
      if (favorite.type === 'track') {
        await db
          .update(tracks)
          .set({ isFavorite: 0 })
          .where(eq(tracks.id, favorite.itemId));
      }
    }
  } catch (e) {
    console.warn('Failed to remove favorite:', e);
  }
}

export async function isFavorite(id: string): Promise<boolean> {
  try {
    const favorite = await db.query.favorites.findFirst({
      where: eq(favorites.id, id),
    });
    return !!favorite;
  } catch (e) {
    console.warn('Failed to check favorite:', e);
    return false;
  }
}

export async function getFavorites(type?: FavoriteType): Promise<FavoriteEntry[]> {
  try {
    let query = db.query.favorites.findMany({
      orderBy: [desc(favorites.createdAt)],
    });

    const results = await query;

    const filtered = type ? results.filter((f) => f.type === type) : results;

    return filtered.map((f) => ({
      id: f.itemId,
      type: f.type as FavoriteType,
      name: f.name,
      subtitle: f.subtitle || undefined,
      image: f.artwork || undefined,
      dateAdded: f.createdAt,
    }));
  } catch (e) {
    console.warn('Failed to get favorites:', e);
    return [];
  }
}

export async function toggleFavoriteDB(trackId: string, isFavorite: boolean): Promise<void> {
  try {
    const compositeId = `track-${trackId}`;
    
    if (isFavorite) {
      // Add to favorites
      const track = await db.query.tracks.findFirst({
        where: eq(tracks.id, trackId),
      });

      if (track) {
        await addFavorite({
          id: trackId,
          type: 'track',
          name: track.title,
          subtitle: track.artist || undefined,
          image: track.artwork || undefined,
          dateAdded: Date.now(),
        });
      }
    } else {
      // Remove from favorites
      await removeFavorite(compositeId);
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

    return songs.filter((t: any) => t.playCount > 0);
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
export async function getHistory(): Promise<any[]> {
  try {
    const history = await db.query.playHistory.findMany({
      orderBy: [desc(playHistory.playedAt)],
      with: {
        track: true,
      },
      limit: 50,
    });

    // Map to Track format and filter out deleted tracks
    return history
      .filter((h) => h.track && !h.track.isDeleted)
      .map((h) => h.track);
  } catch (e) {
    console.warn('Failed to get history:', e);
    return [];
  }
}

export async function getTopSongs(
  period: 'all' | 'day' | 'week' = 'all',
  limit: number = 25
): Promise<any[]> {
  try {
    if (period === 'all') {
      // Get tracks sorted by play count
      const topTracks = await db.query.tracks.findMany({
        where: eq(tracks.isDeleted, 0),
        orderBy: [desc(tracks.playCount), desc(tracks.lastPlayedAt)],
        limit,
      });

      return topTracks.filter((t) => t.playCount > 0);
    } else {
      // Get tracks from history within time period
      const timeThreshold =
        period === 'day'
          ? Date.now() - 24 * 60 * 60 * 1000
          : Date.now() - 7 * 24 * 60 * 60 * 1000;

      const history = await db.query.playHistory.findMany({
        where: sql`${playHistory.playedAt} >= ${timeThreshold}`,
        with: {
          track: true,
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
        .map((item) => item.track);
    }
  } catch (e) {
    console.warn('Failed to get top songs:', e);
    return [];
  }
}