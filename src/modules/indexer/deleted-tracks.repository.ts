import { inArray, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { tracks } from "@/db/schema"
import { removeTracksFromFavoritesAndPlaylists } from "@/modules/tracks/track-cleanup.repository"
import { chunkArray } from "./batch-utils"

export const DELETE_SCOPE_SIZE = 300

export async function processDeletedTracksInScopes(
  deletedTrackIds: string[],
  signal?: AbortSignal
): Promise<void> {
  const deleteScopes = chunkArray(deletedTrackIds, DELETE_SCOPE_SIZE)

  for (const scope of deleteScopes) {
    if (signal?.aborted) return

    await db.update(tracks).set({ isDeleted: 1 }).where(inArray(tracks.id, scope))
    await removeTracksFromFavoritesAndPlaylists(scope)
  }
}

export async function hardDeleteSoftDeletedTracksInScopes(signal?: AbortSignal): Promise<void> {
  const softDeletedTracks = await db.query.tracks.findMany({
    columns: { id: true },
    where: eq(tracks.isDeleted, 1),
  })

  const softDeletedIds = softDeletedTracks.map((t) => t.id)
  if (softDeletedIds.length === 0) return

  const deleteScopes = chunkArray(softDeletedIds, DELETE_SCOPE_SIZE)

  for (const scope of deleteScopes) {
    if (signal?.aborted) return

    await db.delete(tracks).where(inArray(tracks.id, scope))
  }
}
