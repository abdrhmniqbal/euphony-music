import { eq, inArray, sql } from "drizzle-orm"
import { chunkArray } from "@/lib/array"
import { db } from "@/core/db"
import { trackArtists, trackGenres, tracks } from "@/core/db/schema"
import type { SplitMultipleValueConfig } from "@/core/preferences/types"
import { splitArtistsValue, splitGenresValue } from "@/domains/tracks/split-engine"
import { removeTracksFromFavoritesAndPlaylists } from "@/domains/tracks/cleanup-repository"
import { yieldToEventLoop } from "../utils/batch"
import { normalizeText } from "../metadata/normalize"
import { runWithScopeCommit, COMMIT_SCOPE_SIZE } from "./scope-commit"
import {
  getOrCreateArtist,
  getOrCreateAlbum,
  getOrCreateGenre,
  preloadIndexingLookupCache,
} from "./upsert"

const DELETE_SCOPE_SIZE = 300

// --- Deleted tracks ---------------------------------------------------------

export async function processDeletedTracksInScopes(
  deletedTrackIds: string[],
  signal?: AbortSignal
): Promise<void> {
  for (const scope of chunkArray(deletedTrackIds, DELETE_SCOPE_SIZE)) {
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

  for (const scope of chunkArray(softDeletedIds, DELETE_SCOPE_SIZE)) {
    if (signal?.aborted) return
    await db.delete(tracks).where(inArray(tracks.id, scope))
  }
}

// --- Counts / artwork recomputation ----------------------------------------

export async function updateArtistCounts(): Promise<void> {
  await db.run(sql`
    UPDATE artists 
    SET track_count = (
      SELECT COUNT(DISTINCT t.id)
      FROM tracks t
      JOIN track_artists ta ON ta.track_id = t.id
      WHERE ta.artist_id = artists.id AND t.is_deleted = 0
    ),
    album_count = (
      SELECT COUNT(DISTINCT t.album_id)
      FROM tracks t
      JOIN track_artists ta ON ta.track_id = t.id
      WHERE ta.artist_id = artists.id AND t.is_deleted = 0
    ),
    -- Real artwork (Deezer or custom) wins; replace default placeholders or empty artwork with primary track art
    artwork = CASE
      WHEN artists.artwork LIKE '%e23066163f21176a822b54001ee648a2%'
        OR artists.artwork LIKE '%270b9a0569709219d84e115ceba415f9%'
        OR artists.artwork IS NULL
        OR artists.artwork = ''
      THEN COALESCE(
        (
          SELECT t.artwork FROM tracks t
          WHERE t.artist_id = artists.id
            AND t.is_deleted = 0
            AND t.artwork IS NOT NULL
          ORDER BY COALESCE(t.last_played_at, 0) DESC, COALESCE(t.date_added, 0) DESC
          LIMIT 1
        ),
        (
          SELECT a.artwork FROM tracks t
          JOIN track_artists ta ON ta.track_id = t.id
          JOIN albums a ON a.id = t.album_id
          WHERE ta.artist_id = artists.id
            AND t.artist_id != artists.id
            AND t.is_deleted = 0
            AND a.artwork IS NOT NULL
          ORDER BY COALESCE(t.last_played_at, 0) DESC, COALESCE(t.date_added, 0) DESC
          LIMIT 1
        ),
        (
          SELECT a.artwork FROM tracks t
          JOIN albums a ON a.id = t.album_id
          WHERE t.artist_id = artists.id
            AND t.is_deleted = 0
            AND a.artwork IS NOT NULL
          ORDER BY COALESCE(t.last_played_at, 0) DESC, COALESCE(t.date_added, 0) DESC
          LIMIT 1
        )
      )
      ELSE artists.artwork
    END
  `)
}

export async function updateAlbumCounts(): Promise<void> {
  await db.run(sql`
    UPDATE albums 
    SET track_count = (
      SELECT COUNT(*) FROM tracks 
      WHERE tracks.album_id = albums.id AND tracks.is_deleted = 0
    ),
    duration = (
      SELECT COALESCE(SUM(duration), 0) FROM tracks 
      WHERE tracks.album_id = albums.id AND tracks.is_deleted = 0
    ),
    artwork = COALESCE(
      (
        SELECT t.artwork
        FROM tracks t
        WHERE t.album_id = albums.id
          AND t.is_deleted = 0
          AND t.artwork IS NOT NULL
        GROUP BY t.artwork
        ORDER BY COUNT(*) DESC, COALESCE(MAX(t.date_added), 0) DESC
        LIMIT 1
      ),
      albums.artwork
    ),
    updated_at = ${Date.now()}
  `)
}

export async function updateGenreCounts(): Promise<void> {
  await db.run(sql`
    UPDATE genres 
    SET track_count = (
      SELECT COUNT(*) FROM track_genres tg
      JOIN tracks t ON tg.track_id = t.id
      WHERE tg.genre_id = genres.id AND t.is_deleted = 0
    )
  `)
}

// --- Split relation rebuild -------------------------------------------------

export interface SplitRelationRebuildResult {
  rebuiltTracks: number
  tracksMissingRawArtist: number
  tracksMissingRawAlbumArtist: number
  tracksMissingRawGenre: number
}

function dedupeNormalizedValues(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const normalized = normalizeText(value)
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(normalized)
  }

  return result
}

export async function rebuildSplitMetadataRelations(
  splitConfig: SplitMultipleValueConfig
): Promise<SplitRelationRebuildResult> {
  const lookupCache = await preloadIndexingLookupCache()
  const indexedTracks = await db.query.tracks.findMany({
    columns: {
      id: true,
      rawArtist: true,
      rawAlbumArtist: true,
      rawGenre: true,
      albumId: true,
    },
    where: eq(tracks.isDeleted, 0),
    with: {
      artist: true,
      album: { with: { artist: true } },
      genres: { with: { genre: true } },
    },
  })

  let rebuiltTracks = 0
  let tracksMissingRawArtist = 0
  let tracksMissingRawAlbumArtist = 0
  let tracksMissingRawGenre = 0

  for (const scope of chunkArray(indexedTracks, COMMIT_SCOPE_SIZE)) {
    await runWithScopeCommit(async () => {
      for (const track of scope) {
        const artistSource = normalizeText(track.rawArtist) || track.artist?.name
        const albumArtistSource =
          normalizeText(track.rawAlbumArtist) || track.album?.artist?.name || artistSource
        const genreSource =
          normalizeText(track.rawGenre) ||
          track.genres
            ?.map((entry) => entry.genre?.name)
            .filter((value): value is string => Boolean(value))
            .join(", ")

        if (!track.rawArtist) tracksMissingRawArtist += 1
        if (!track.rawAlbumArtist) tracksMissingRawAlbumArtist += 1
        if (!track.rawGenre) tracksMissingRawGenre += 1

        const artistNames = dedupeNormalizedValues(splitArtistsValue(artistSource, splitConfig))
        const primaryArtistName =
          splitConfig.artistSplitMode === "original" ? normalizeText(artistSource) : artistNames[0]
        const primaryArtistId = primaryArtistName
          ? await getOrCreateArtist(primaryArtistName, lookupCache)
          : null
        const albumArtistNames = dedupeNormalizedValues(
          splitArtistsValue(albumArtistSource, splitConfig)
        )
        const primaryAlbumArtistName =
          splitConfig.artistSplitMode === "original"
            ? normalizeText(albumArtistSource)
            : albumArtistNames[0]
        const primaryAlbumArtistId = primaryAlbumArtistName
          ? await getOrCreateArtist(primaryAlbumArtistName, lookupCache)
          : primaryArtistId
        const albumId =
          track.album?.title && primaryAlbumArtistId
            ? await getOrCreateAlbum(
                track.album.title,
                primaryAlbumArtistId,
                track.album.artwork || undefined,
                track.album.year || undefined,
                lookupCache
              )
            : track.albumId
        const relationArtistNames =
          splitConfig.artistSplitMode === "original"
            ? primaryArtistName
              ? [primaryArtistName]
              : []
            : artistNames.length > 0
              ? artistNames
              : primaryArtistName
                ? [primaryArtistName]
                : []
        const relationArtistIds = Array.from(
          new Set(
            await Promise.all(
              relationArtistNames.map((artist) => getOrCreateArtist(artist, lookupCache))
            )
          )
        )
        const genreNames = dedupeNormalizedValues(splitGenresValue(genreSource, splitConfig))
        const genreIds = await Promise.all(
          (genreNames.length > 0 ? genreNames : ["Unknown"]).map((genre) =>
            getOrCreateGenre(genre, lookupCache)
          )
        )

        await db
          .update(tracks)
          .set({ artistId: primaryArtistId, albumId, updatedAt: Date.now() })
          .where(eq(tracks.id, track.id))
        await db.delete(trackArtists).where(eq(trackArtists.trackId, track.id))
        await db.delete(trackGenres).where(eq(trackGenres.trackId, track.id))

        if (relationArtistIds.length > 0) {
          await db
            .insert(trackArtists)
            .values(relationArtistIds.map((artistId) => ({ trackId: track.id, artistId })))
        }

        await db
          .insert(trackGenres)
          .values(genreIds.map((genreId) => ({ trackId: track.id, genreId })))

        rebuiltTracks += 1
      }
    })

    await yieldToEventLoop()
  }

  await updateArtistCounts()
  await updateAlbumCounts()
  await updateGenreCounts()

  return {
    rebuiltTracks,
    tracksMissingRawArtist,
    tracksMissingRawAlbumArtist,
    tracksMissingRawGenre,
  }
}
