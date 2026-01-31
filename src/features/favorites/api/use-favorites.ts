import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/db/client";
import { favorites, tracks, artists, albums, playlists } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

const FAVORITES_KEY = "favorites";

export type FavoriteType = "track" | "artist" | "album" | "playlist" | "genre";

export function useFavorites(type?: FavoriteType) {
  return useQuery({
    queryKey: [FAVORITES_KEY, type],
    queryFn: async () => {
      let query = db.query.favorites.findMany({
        orderBy: [desc(favorites.createdAt)],
      });

      const results = await query;

      if (type) {
        return results.filter((f) => f.type === type);
      }

      return results;
    },
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      itemId,
      name,
      subtitle,
      artwork,
    }: {
      type: FavoriteType;
      itemId: string;
      name: string;
      subtitle?: string;
      artwork?: string;
    }) => {
      const id = `${type}-${itemId}`;
      
      await db.insert(favorites).values({
        id,
        type,
        itemId,
        name,
        subtitle: subtitle || null,
        artwork: artwork || null,
        createdAt: Date.now(),
      });

      // Also update the source table if it's a track
      if (type === "track") {
        await db
          .update(tracks)
          .set({ isFavorite: 1 })
          .where(eq(tracks.id, itemId));
      }

      return { id, type, itemId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FAVORITES_KEY] });
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const favorite = await db.query.favorites.findFirst({
        where: eq(favorites.id, id),
      });

      if (favorite) {
        await db.delete(favorites).where(eq(favorites.id, id));

        // Also update the source table if it's a track
        if (favorite.type === "track") {
          await db
            .update(tracks)
            .set({ isFavorite: 0 })
            .where(eq(tracks.id, favorite.itemId));
        }
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FAVORITES_KEY] });
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
    },
  });
}

export function useIsFavorite(type: FavoriteType, itemId: string) {
  return useQuery({
    queryKey: [FAVORITES_KEY, type, itemId],
    queryFn: async () => {
      const id = `${type}-${itemId}`;
      const favorite = await db.query.favorites.findFirst({
        where: eq(favorites.id, id),
      });
      return !!favorite;
    },
  });
}

export function useToggleFavorite() {
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      itemId,
      name,
      subtitle,
      artwork,
      isCurrentlyFavorite,
    }: {
      type: FavoriteType;
      itemId: string;
      name: string;
      subtitle?: string;
      artwork?: string;
      isCurrentlyFavorite: boolean;
    }) => {
      if (isCurrentlyFavorite) {
        const id = `${type}-${itemId}`;
        await removeFavorite.mutateAsync(id);
      } else {
        await addFavorite.mutateAsync({
          type,
          itemId,
          name,
          subtitle,
          artwork,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FAVORITES_KEY] });
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
    },
  });
}
