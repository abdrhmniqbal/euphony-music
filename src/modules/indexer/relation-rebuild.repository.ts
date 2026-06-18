import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { trackArtists, trackGenres, tracks } from "@/db/schema"
import { normalizeText } from "./normalization"
import { chunkArray, yieldToEventLoop } from "./batch-utils"
import { runWithScopeCommit, COMMIT_SCOPE_SIZE } from "./scope-commit"
import {
  preloadIndexingLookupCache,
  getOrCreateArtist,
  getOrCreateAlbum,
  getOrCreateGenre,
} from "./lookup-cache.repository"
import {
  splitArtistsValue,
  splitGenresValue,
  type SplitMultipleValueConfig,
} from "@/modules/settings/split-multiple-values"
import { updateAlbumCounts, updateArtistCounts, updateGenreCounts } from "./counts.repository"

export interface SplitRelationRebuildResult {
  rebuiltTracks: number
  tracksMissingRawArtist: number
  tracksMissingRawAlbumArtist: number
  tracksMissingRawGenre: number
}

export function dedupeNormalizedValues(values: string[]) {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const normalized = normalizeText(value)
    if (!normalized) {
      continue
    }

    const key = normalized.toLowerCase()
    if (seen.has(key)) {
      continue
    }

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

        if (!track.rawArtist) {
          tracksMissingRawArtist += 1
        }

        if (!track.rawAlbumArtist) {
          tracksMissingRawAlbumArtist += 1
        }

        if (!track.rawGenre) {
          tracksMissingRawGenre += 1
        }

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
        const relationArtistNames = dedupeNormalizedValues(
          splitArtistsValue(artistSource, splitConfig)
        )
        const relationArtistIds = Array.from(
          new Set(
            await Promise.all(
              [...relationArtistNames, primaryArtistName ?? ""]
                .filter((artist): artist is string => Boolean(artist))
                .map((artist) => getOrCreateArtist(artist, lookupCache))
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
          await db.insert(trackArtists).values(
            relationArtistIds.map((artistId) => ({
              trackId: track.id,
              artistId,
            }))
          )
        }

        await db.insert(trackGenres).values(
          genreIds.map((genreId) => ({
            trackId: track.id,
            genreId,
          }))
        )

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
