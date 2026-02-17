import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { and, asc, desc, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { playlistTracks, playlists } from "@/db/schema"
import { createPlaylist } from "@/modules/playlist/playlist.api"

const PLAYLISTS_KEY = "playlists"

export function usePlaylists() {
  return useQuery({
    queryKey: [PLAYLISTS_KEY],
    queryFn: async () => {
      const results = await db.query.playlists.findMany({
        orderBy: [desc(playlists.createdAt)],
        with: {
          tracks: {
            limit: 10,
            orderBy: [asc(playlistTracks.position)],
            with: {
              track: {
                with: {
                  album: true,
                },
              },
            },
          },
        },
      })

      return results.map((playlist) => {
        const images = new Set<string>()

        if (playlist.artwork) {
          images.add(playlist.artwork)
        }

        for (const pt of playlist.tracks) {
          const t = pt.track
          const img =
            t.artwork ||
            (typeof t.album === "object" && t.album
              ? (t.album as any).artwork
              : undefined)
          if (img) images.add(img)
          if (images.size >= 4) break
        }

        return {
          id: playlist.id,
          name: playlist.name,
          title: playlist.name,
          dateAdded: playlist.createdAt,
          trackCount: playlist.trackCount || 0,
          image: playlist.artwork || undefined,
          images: Array.from(images),
        }
      })
    },
  })
}

export function usePlaylist(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [PLAYLISTS_KEY, id],
    enabled: enabled && id.length > 0,
    queryFn: async () => {
      const result = await db.query.playlists.findFirst({
        where: eq(playlists.id, id),
        with: {
          tracks: {
            orderBy: [asc(playlistTracks.position)],
            with: {
              track: {
                with: {
                  artist: true,
                  album: true,
                },
              },
            },
          },
        },
      })
      return result ?? null
    },
  })
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      name,
      description,
      trackIds,
    }: {
      name: string
      description?: string
      trackIds: string[]
    }) => {
      await createPlaylist(name, description, trackIds)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLAYLISTS_KEY] })
    },
  })
}

export function useUpdatePlaylist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
    }: {
      id: string
      name?: string
      description?: string
    }) => {
      await db
        .update(playlists)
        .set({
          ...(name && { name }),
          ...(description !== undefined && { description }),
          updatedAt: Date.now(),
        })
        .where(eq(playlists.id, id))
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PLAYLISTS_KEY] })
      queryClient.invalidateQueries({ queryKey: [PLAYLISTS_KEY, variables.id] })
    },
  })
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await db.delete(playlists).where(eq(playlists.id, id))
    },
    onSuccess: (_, deletedPlaylistId) => {
      queryClient.invalidateQueries({ queryKey: [PLAYLISTS_KEY] })
      queryClient.invalidateQueries({
        queryKey: [PLAYLISTS_KEY, deletedPlaylistId],
      })
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      queryClient.invalidateQueries({ queryKey: ["favorites", "playlist"] })
      queryClient.invalidateQueries({
        queryKey: ["favorites", "playlist", deletedPlaylistId],
      })
      queryClient.invalidateQueries({ queryKey: ["library", "favorites"] })
    },
  })
}

export function useAddTrackToPlaylist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      playlistId,
      trackId,
    }: {
      playlistId: string
      trackId: string
    }) => {
      const existingTracks = await db.query.playlistTracks.findMany({
        where: eq(playlistTracks.playlistId, playlistId),
        orderBy: [desc(playlistTracks.position)],
        limit: 1,
      })

      const nextPosition =
        existingTracks.length > 0 ? (existingTracks[0].position || 0) + 1 : 0

      await db.insert(playlistTracks).values({
        id: generateId(),
        playlistId,
        trackId,
        position: nextPosition,
        addedAt: Date.now(),
      })

      await updatePlaylistStats(playlistId)
      return { playlistId, trackId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [PLAYLISTS_KEY, variables.playlistId],
      })
      queryClient.invalidateQueries({ queryKey: [PLAYLISTS_KEY] })
    },
  })
}

export function useRemoveTrackFromPlaylist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      playlistId,
      trackId,
    }: {
      playlistId: string
      trackId: string
    }) => {
      await db
        .delete(playlistTracks)
        .where(
          and(
            eq(playlistTracks.playlistId, playlistId),
            eq(playlistTracks.trackId, trackId)
          )
        )

      const remainingTracks = await db.query.playlistTracks.findMany({
        where: eq(playlistTracks.playlistId, playlistId),
        orderBy: [asc(playlistTracks.position)],
      })

      for (let i = 0; i < remainingTracks.length; i++) {
        await db
          .update(playlistTracks)
          .set({ position: i })
          .where(eq(playlistTracks.id, remainingTracks[i].id))
      }

      await updatePlaylistStats(playlistId)
      return { playlistId, trackId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [PLAYLISTS_KEY, variables.playlistId],
      })
      queryClient.invalidateQueries({ queryKey: [PLAYLISTS_KEY] })
    },
  })
}

export function useReorderPlaylistTracks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      playlistId,
      trackIds,
    }: {
      playlistId: string
      trackIds: string[]
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
          )
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [PLAYLISTS_KEY, variables.playlistId],
      })
      queryClient.invalidateQueries({ queryKey: [PLAYLISTS_KEY] })
    },
  })
}

async function updatePlaylistStats(playlistId: string) {
  const trackEntries = await db.query.playlistTracks.findMany({
    where: eq(playlistTracks.playlistId, playlistId),
    with: {
      track: true,
    },
  })

  const trackCount = trackEntries.length
  const duration = trackEntries.reduce(
    (sum, entry) => sum + (entry.track?.duration || 0),
    0
  )

  await db
    .update(playlists)
    .set({
      trackCount,
      duration,
      updatedAt: Date.now(),
    })
    .where(eq(playlists.id, playlistId))
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}
