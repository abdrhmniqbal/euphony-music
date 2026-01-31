import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/db/client";
import { playlists, playlistTracks, tracks } from "@/db/schema";
import { eq, and, inArray, asc, sql } from "drizzle-orm";

const PLAYLISTS_KEY = "playlists";

export function usePlaylists() {
  return useQuery({
    queryKey: [PLAYLISTS_KEY],
    queryFn: async () => {
      return db.query.playlists.findMany({
        orderBy: [asc(playlists.name)],
      });
    },
  });
}

export function usePlaylist(id: string) {
  return useQuery({
    queryKey: [PLAYLISTS_KEY, id],
    queryFn: async () => {
      const playlist = await db.query.playlists.findFirst({
        where: eq(playlists.id, id),
      });

      if (!playlist) return null;

      const trackEntries = await db.query.playlistTracks.findMany({
        where: eq(playlistTracks.playlistId, id),
        orderBy: [asc(playlistTracks.position)],
        with: {
          track: {
            with: {
              artist: true,
              album: true,
            },
          },
        },
      });

      return {
        ...playlist,
        tracks: trackEntries.map((entry) => entry.track),
      };
    },
  });
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description?: string;
    }) => {
      const id = generateId();
      await db.insert(playlists).values({
        id,
        name,
        description: description || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLAYLISTS_KEY] });
    },
  });
}

export function useUpdatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
    }: {
      id: string;
      name?: string;
      description?: string;
    }) => {
      await db
        .update(playlists)
        .set({
          ...(name && { name }),
          ...(description !== undefined && { description }),
          updatedAt: Date.now(),
        })
        .where(eq(playlists.id, id));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PLAYLISTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PLAYLISTS_KEY, variables.id] });
    },
  });
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await db.delete(playlists).where(eq(playlists.id, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLAYLISTS_KEY] });
    },
  });
}

export function useAddTrackToPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistId,
      trackId,
    }: {
      playlistId: string;
      trackId: string;
    }) => {
      // Get current max position
      const existingTracks = await db.query.playlistTracks.findMany({
        where: eq(playlistTracks.playlistId, playlistId),
        orderBy: [desc(playlistTracks.position)],
        limit: 1,
      });

      const nextPosition = existingTracks.length > 0 
        ? (existingTracks[0].position || 0) + 1 
        : 0;

      await db.insert(playlistTracks).values({
        id: generateId(),
        playlistId,
        trackId,
        position: nextPosition,
        addedAt: Date.now(),
      });

      // Update playlist track count
      await updatePlaylistStats(playlistId);

      return { playlistId, trackId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PLAYLISTS_KEY, variables.playlistId] });
    },
  });
}

export function useRemoveTrackFromPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistId,
      trackId,
    }: {
      playlistId: string;
      trackId: string;
    }) => {
      await db
        .delete(playlistTracks)
        .where(
          and(
            eq(playlistTracks.playlistId, playlistId),
            eq(playlistTracks.trackId, trackId)
          )
        );

      // Reorder remaining tracks
      const remainingTracks = await db.query.playlistTracks.findMany({
        where: eq(playlistTracks.playlistId, playlistId),
        orderBy: [asc(playlistTracks.position)],
      });

      for (let i = 0; i < remainingTracks.length; i++) {
        await db
          .update(playlistTracks)
          .set({ position: i })
          .where(eq(playlistTracks.id, remainingTracks[i].id));
      }

      // Update playlist track count
      await updatePlaylistStats(playlistId);

      return { playlistId, trackId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PLAYLISTS_KEY, variables.playlistId] });
    },
  });
}

export function useReorderPlaylistTracks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistId,
      trackIds,
    }: {
      playlistId: string;
      trackIds: string[];
    }) => {
      for (let i = 0; i < trackIds.length; i++) {
        await db
          .update(playlistTracks)
          .set({ position: i })
          .where(
            and(
              eq(playlistTracks.playlistId, playlistId),
              eq(playlistTracks.trackId, trackIds[i])
            )
          );
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PLAYLISTS_KEY, variables.playlistId] });
    },
  });
}

async function updatePlaylistStats(playlistId: string) {
  const trackEntries = await db.query.playlistTracks.findMany({
    where: eq(playlistTracks.playlistId, playlistId),
    with: {
      track: true,
    },
  });

  const trackCount = trackEntries.length;
  const duration = trackEntries.reduce((sum, entry) => sum + (entry.track?.duration || 0), 0);

  await db
    .update(playlists)
    .set({
      trackCount,
      duration,
      updatedAt: Date.now(),
    })
    .where(eq(playlists.id, playlistId));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

import { desc } from "drizzle-orm";
