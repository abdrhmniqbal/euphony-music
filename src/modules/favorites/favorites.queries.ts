import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/db/client";
import { tracks, artists, albums, playlists } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const FAVORITES_KEY = "favorites";

export type FavoriteType = "track" | "artist" | "album" | "playlist";

// Helper to get the correct table for each type
function getTableForType(type: FavoriteType) {
  switch (type) {
    case "track":
      return tracks;
    case "artist":
      return artists;
    case "album":
      return albums;
    case "playlist":
      return playlists;
    default:
      throw new Error(`Unknown favorite type: ${type}`);
  }
}

// Unified favorite entry type
export interface FavoriteEntry {
  id: string;
  type: FavoriteType;
  name: string;
  subtitle?: string;
  artwork?: string;
  images?: string[];
  favoritedAt: number;
}

export function useFavorites(type?: FavoriteType) {
  return useQuery({
    queryKey: [FAVORITES_KEY, type],
    queryFn: async () => {
      const favorites: FavoriteEntry[] = [];

      // Query each entity table for favorites
      if (!type || type === "track") {
        const trackFavorites = await db.query.tracks.findMany({
          where: eq(tracks.isFavorite, 1),
          with: { artist: true },
        });
        favorites.push(
          ...trackFavorites.map((t) => ({
            id: t.id,
            type: "track" as const,
            name: t.title,
            subtitle: t.artist?.name,
            artwork: t.artwork || undefined,
            favoritedAt: t.favoritedAt || Date.now(),
          }))
        );
      }

      if (!type || type === "artist") {
        const artistFavorites = await db.query.artists.findMany({
          where: eq(artists.isFavorite, 1),
        });
        favorites.push(
          ...artistFavorites.map((a) => ({
            id: a.id,
            type: "artist" as const,
            name: a.name,
            subtitle: `${a.trackCount} tracks`,
            artwork: a.artwork || undefined,
            favoritedAt: a.favoritedAt || Date.now(),
          }))
        );
      }

      if (!type || type === "album") {
        const albumFavorites = await db.query.albums.findMany({
          where: eq(albums.isFavorite, 1),
          with: { artist: true },
        });
        favorites.push(
          ...albumFavorites.map((a) => ({
            id: a.id,
            type: "album" as const,
            name: a.title,
            subtitle: a.artist?.name,
            artwork: a.artwork || undefined,
            favoritedAt: a.favoritedAt || Date.now(),
          }))
        );
      }

      if (!type || type === "playlist") {
        const playlistFavorites = await db.query.playlists.findMany({
          where: eq(playlists.isFavorite, 1),
          with: {
            tracks: {
              with: {
                track: {
                  with: {
                    album: true,
                  },
                },
              },
              limit: 4,
            },
          },
        });
        favorites.push(
          ...playlistFavorites.map((p) => {
            const images: string[] = [];

            if (p.artwork) {
              images.push(p.artwork);
            }

            p.tracks.forEach((playlistTrack) => {
              const artwork =
                playlistTrack.track?.artwork ||
                playlistTrack.track?.album?.artwork;

              if (artwork && !images.includes(artwork) && images.length < 4) {
                images.push(artwork);
              }
            });

            return {
              id: p.id,
              type: "playlist" as const,
              name: p.name,
              subtitle: `${p.trackCount} tracks`,
              artwork: p.artwork || undefined,
              images,
              favoritedAt: p.favoritedAt || Date.now(),
            };
          })
        );
      }

      // Sort by favoritedAt descending
      return favorites.sort((a, b) => b.favoritedAt - a.favoritedAt);
    },
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      itemId,
    }: {
      type: FavoriteType;
      itemId: string;
    }) => {
      const table = getTableForType(type);
      const now = Date.now();

      await db
        .update(table)
        .set({ isFavorite: 1, favoritedAt: now })
        .where(eq(table.id, itemId));

      return { type, itemId, favoritedAt: now };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FAVORITES_KEY] });
      queryClient.invalidateQueries({ queryKey: ["library", "favorites"] });
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
      queryClient.invalidateQueries({ queryKey: ["library", "tracks"] });
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      itemId,
    }: {
      type: FavoriteType;
      itemId: string;
    }) => {
      const table = getTableForType(type);

      await db
        .update(table)
        .set({ isFavorite: 0, favoritedAt: null })
        .where(eq(table.id, itemId));

      return { type, itemId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FAVORITES_KEY] });
      queryClient.invalidateQueries({ queryKey: ["library", "favorites"] });
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
      queryClient.invalidateQueries({ queryKey: ["library", "tracks"] });
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });
}

export function useIsFavorite(type: FavoriteType, itemId: string) {
  return useQuery({
    queryKey: [FAVORITES_KEY, type, itemId],
    queryFn: async () => {
      const table = getTableForType(type);
      const result = await db
        .select({ isFavorite: table.isFavorite })
        .from(table)
        .where(eq(table.id, itemId))
        .limit(1);

      return result[0]?.isFavorite === 1;
    },
  });
}

export function useToggleFavorite() {
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  return useMutation({
    mutationFn: async ({
      type,
      itemId,
      isCurrentlyFavorite,
    }: {
      type: FavoriteType;
      itemId: string;
      isCurrentlyFavorite: boolean;
    }) => {
      if (isCurrentlyFavorite) {
        await removeFavorite.mutateAsync({ type, itemId });
      } else {
        await addFavorite.mutateAsync({ type, itemId });
      }
    },
  });
}
