/**
 * Purpose: Preserves user data when a music file is moved/renamed and MediaStore assigns it a new asset id.
 * Caller: scanMediaLibrary() after batches commit, before marking remaining disappeared tracks deleted.
 * Dependencies: Drizzle DB schema, identity-match.
 * Main Functions: loadIdentityRows(), reconcileAdoptions()
 * Side Effects: Reads/writes tracks, play_history, playlist_tracks, mix_tracks inside transactions.
 */

import { eq, inArray, sql } from "drizzle-orm"
import { db } from "@/core/db"
import { logWarn } from "@/core/log/service"
import { albums, artists, mixTracks, playHistory, playlistTracks, tracks } from "@/core/db/schema"
import { findBestMatch, type TrackIdentityRow } from "./identity-match"

export type { TrackIdentityRow } from "./identity-match"

function identitySelect() {
  return db
    .select({
      id: tracks.id,
      title: tracks.title,
      duration: tracks.duration,
      audioBitrate: tracks.audioBitrate,
      audioSampleRate: tracks.audioSampleRate,
      audioCodec: tracks.audioCodec,
      artistName: artists.name,
      albumTitle: albums.title,
      playCount: tracks.playCount,
      lastPlayedAt: tracks.lastPlayedAt,
      rating: tracks.rating,
      isFavorite: tracks.isFavorite,
      favoritedAt: tracks.favoritedAt,
      dateAdded: tracks.dateAdded,
    })
    .from(tracks)
    .leftJoin(artists, eq(tracks.artistId, artists.id))
    .leftJoin(albums, eq(tracks.albumId, albums.id))
}

export async function loadIdentityRows(ids: string[]): Promise<TrackIdentityRow[]> {
  const rows: TrackIdentityRow[] = []
  for (let i = 0; i < ids.length; i += 300) {
    const scope = ids.slice(i, i + 300)
    if (scope.length === 0) continue
    rows.push(...(await identitySelect().where(inArray(tracks.id, scope))))
  }
  return rows
}

async function adoptIdentity(oldRow: TrackIdentityRow, newRow: TrackIdentityRow): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(tracks)
      .set({
        playCount: oldRow.playCount ?? 0,
        lastPlayedAt: oldRow.lastPlayedAt,
        rating: oldRow.rating,
        isFavorite: oldRow.isFavorite ?? 0,
        favoritedAt: oldRow.favoritedAt,
        dateAdded: oldRow.dateAdded,
        updatedAt: Date.now(),
      })
      .where(eq(tracks.id, newRow.id))

    // OR IGNORE: a child row may already reference the new id (e.g. the file
    // was played between scan start and adoption); leftovers on the old id
    // would otherwise violate unique keys.
    await tx.run(
      sql`UPDATE OR IGNORE play_history SET track_id = ${newRow.id} WHERE track_id = ${oldRow.id}`
    )
    await tx.delete(playHistory).where(eq(playHistory.trackId, oldRow.id))
    await tx.run(
      sql`UPDATE OR IGNORE playlist_tracks SET track_id = ${newRow.id} WHERE track_id = ${oldRow.id}`
    )
    await tx.delete(playlistTracks).where(eq(playlistTracks.trackId, oldRow.id))
    await tx.run(
      sql`UPDATE OR IGNORE mix_tracks SET track_id = ${newRow.id} WHERE track_id = ${oldRow.id}`
    )
    await tx.delete(mixTracks).where(eq(mixTracks.trackId, oldRow.id))

    await tx.delete(tracks).where(eq(tracks.id, oldRow.id))
  })
}

export async function reconcileAdoptions(options: {
  newTrackIds: string[]
  candidates: TrackIdentityRow[]
}): Promise<Set<string>> {
  const { newTrackIds, candidates } = options
  if (newTrackIds.length === 0 || candidates.length === 0) {
    return new Set()
  }

  const freshRows = await loadIdentityRows(newTrackIds)
  const pool = [...candidates]
  const adoptedOldIds = new Set<string>()

  for (const freshRow of freshRows) {
    const match = findBestMatch(freshRow, pool)
    if (!match) continue
    pool.splice(pool.indexOf(match), 1)
    adoptedOldIds.add(match.id)
    try {
      await adoptIdentity(match, freshRow)
    } catch (error) {
      adoptedOldIds.delete(match.id)
      logWarn("Failed to adopt disappeared track identity", {
        error,
        oldId: match.id,
        newId: freshRow.id,
      })
    }
  }

  return adoptedOldIds
}
