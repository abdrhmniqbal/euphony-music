import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/db/client";
import { tracks, artists, albums, genres, trackGenres, playHistory } from "@/db/schema";
import { eq, desc, asc, like, and, inArray, sql } from "drizzle-orm";
import { useDebouncedValue } from "@tanstack/react-pacer/debouncer";

const TRACKS_KEY = "tracks";
const ARTISTS_KEY = "artists";
const ALBUMS_KEY = "albums";
const GENRES_KEY = "genres";

export type TrackFilter = {
  artistId?: string;
  albumId?: string;
  genreId?: string;
  isFavorite?: boolean;
  searchQuery?: string;
  sortBy?: "title" | "artist" | "album" | "dateAdded" | "playCount" | "rating";
  sortOrder?: "asc" | "desc";
};

export function useTracks(filters?: TrackFilter) {
  return useQuery({
    queryKey: [TRACKS_KEY, filters],
    queryFn: async () => {
      let query = db.query.tracks.findMany({
        with: {
          artist: true,
          album: {
            with: {
              artist: true,
            },
          },
          genres: {
            with: {
              genre: true,
            },
          },
        },
        where: and(
          eq(tracks.isDeleted, 0),
          filters?.artistId ? eq(tracks.artistId, filters.artistId) : undefined,
          filters?.albumId ? eq(tracks.albumId, filters.albumId) : undefined,
          filters?.isFavorite ? eq(tracks.isFavorite, 1) : undefined,
          filters?.searchQuery
            ? like(tracks.title, `%${filters.searchQuery}%`)
            : undefined
        ),
      });

      const results = await query;

      // Filter by genre if needed
      let filteredResults = results;
      if (filters?.genreId) {
        filteredResults = results.filter((track) =>
          track.genres.some((tg) => tg.genre?.id === filters.genreId)
        );
      }

      // Sort results
      const sortField = filters?.sortBy || "title";
      const sortOrder = filters?.sortOrder || "asc";

      return filteredResults.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "title":
            comparison = (a.title || "").localeCompare(b.title || "");
            break;
          case "artist":
            comparison = (a.artist?.name || "").localeCompare(b.artist?.name || "");
            break;
          case "album":
            comparison = (a.album?.title || "").localeCompare(b.album?.title || "");
            break;
          case "dateAdded":
            comparison = (a.dateAdded || 0) - (b.dateAdded || 0);
            break;
          case "playCount":
            comparison = (a.playCount || 0) - (b.playCount || 0);
            break;
          case "rating":
            comparison = (a.rating || 0) - (b.rating || 0);
            break;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
    },
  });
}

export function useTrack(id: string) {
  return useQuery({
    queryKey: [TRACKS_KEY, id],
    queryFn: async () => {
      return db.query.tracks.findFirst({
        where: eq(tracks.id, id),
        with: {
          artist: true,
          album: {
            with: {
              artist: true,
            },
          },
          genres: {
            with: {
              genre: true,
            },
          },
        },
      });
    },
  });
}

export function useToggleFavoriteTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      trackId,
      isFavorite,
    }: {
      trackId: string;
      isFavorite: boolean;
    }) => {
      await db
        .update(tracks)
        .set({ isFavorite: isFavorite ? 1 : 0 })
        .where(eq(tracks.id, trackId));

      return { trackId, isFavorite };
    },
    onMutate: async ({ trackId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: [TRACKS_KEY, trackId] });
      const previousTrack = queryClient.getQueryData([TRACKS_KEY, trackId]);

      queryClient.setQueryData([TRACKS_KEY, trackId], (old: any) => ({
        ...old,
        isFavorite,
      }));

      return { previousTrack };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        [TRACKS_KEY, variables.trackId],
        context?.previousTrack
      );
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: [TRACKS_KEY, variables.trackId] });
      queryClient.invalidateQueries({ queryKey: [TRACKS_KEY] });
    },
  });
}

export function useIncrementPlayCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackId: string) => {
      const now = Date.now();

      await db
        .update(tracks)
        .set({
          playCount: sql`${tracks.playCount} + 1`,
          lastPlayedAt: now,
        })
        .where(eq(tracks.id, trackId));

      await db.insert(playHistory).values({
        id: `${trackId}-${now}`,
        trackId,
        playedAt: now,
      });

      return trackId;
    },
    onSuccess: (trackId) => {
      queryClient.invalidateQueries({ queryKey: [TRACKS_KEY, trackId] });
    },
  });
}

export function useArtists() {
  return useQuery({
    queryKey: [ARTISTS_KEY],
    queryFn: async () => {
      return db.query.artists.findMany({
        orderBy: [asc(artists.sortName)],
      });
    },
  });
}

export function useArtist(id: string) {
  return useQuery({
    queryKey: [ARTISTS_KEY, id],
    queryFn: async () => {
      return db.query.artists.findFirst({
        where: eq(artists.id, id),
        with: {
          albums: {
            orderBy: [desc(albums.year)],
          },
          tracks: {
            where: eq(tracks.isDeleted, 0),
            with: {
              album: true,
            },
          },
        },
      });
    },
  });
}

export function useAlbums() {
  return useQuery({
    queryKey: [ALBUMS_KEY],
    queryFn: async () => {
      return db.query.albums.findMany({
        with: {
          artist: true,
        },
        orderBy: [desc(albums.year)],
      });
    },
  });
}

export function useAlbum(id: string) {
  return useQuery({
    queryKey: [ALBUMS_KEY, id],
    queryFn: async () => {
      return db.query.albums.findFirst({
        where: eq(albums.id, id),
        with: {
          artist: true,
          tracks: {
            where: eq(tracks.isDeleted, 0),
            orderBy: [
              asc(tracks.discNumber),
              asc(tracks.trackNumber),
              asc(tracks.title),
            ],
            with: {
              artist: true,
            },
          },
        },
      });
    },
  });
}

export function useGenres() {
  return useQuery({
    queryKey: [GENRES_KEY],
    queryFn: async () => {
      return db.query.genres.findMany({
        orderBy: [asc(genres.name)],
      });
    },
  });
}

export function useGenre(id: string) {
  return useQuery({
    queryKey: [GENRES_KEY, id],
    queryFn: async () => {
      const genre = await db.query.genres.findFirst({
        where: eq(genres.id, id),
      });

      if (!genre) return null;

      // Get tracks for this genre
      const trackIds = await db
        .select({ trackId: trackGenres.trackId })
        .from(trackGenres)
        .where(eq(trackGenres.genreId, id));

      const trackList = await db.query.tracks.findMany({
        where: and(
          inArray(
            tracks.id,
            trackIds.map((t) => t.trackId)
          ),
          eq(tracks.isDeleted, 0)
        ),
        with: {
          artist: true,
          album: true,
        },
      });

      return {
        ...genre,
        tracks: trackList,
      };
    },
  });
}

export function useSearch(query: string) {
  const [debouncedQuery] = useDebouncedValue(query, {
    wait: 300,
  });

  return useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { tracks: [], artists: [], albums: [], genres: [] };
      }

      const searchTerm = `%${debouncedQuery}%`;

      const [trackResults, artistResults, albumResults, genreResults] =
        await Promise.all([
          db.query.tracks.findMany({
            where: and(
              like(tracks.title, searchTerm),
              eq(tracks.isDeleted, 0)
            ),
            with: { artist: true, album: true },
            limit: 20,
          }),
          db.query.artists.findMany({
            where: like(artists.name, searchTerm),
            limit: 10,
          }),
          db.query.albums.findMany({
            where: like(albums.title, searchTerm),
            with: { artist: true },
            limit: 10,
          }),
          db.query.genres.findMany({
            where: like(genres.name, searchTerm),
            limit: 10,
          }),
        ]);

      return {
        tracks: trackResults,
        artists: artistResults,
        albums: albumResults,
        genres: genreResults,
      };
    },
    enabled: debouncedQuery.length >= 2,
  });
}

export function useRecentSearches() {
  return useQuery({
    queryKey: ["recent-searches"],
    queryFn: async () => {
      // In a real implementation, you'd store recent searches in a table
      // For now, return empty
      return [] as string[];
    },
  });
}
