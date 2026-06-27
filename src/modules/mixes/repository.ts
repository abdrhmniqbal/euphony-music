import { createId } from "@paralleldrive/cuid2"
import type { Track } from "@/modules/player/types"
import { asc, desc, eq, inArray } from "drizzle-orm"

import { db } from "@/db/client"
import { mixTracks, mixes, playHistory, tracks } from "@/db/schema"
import type { DBTrack } from "@/types/database"
import { transformDBTrackToTrack } from "@/utils/transformers"
import {
  buildProfile,
  getDaySeed,
  getMixVisual,
  getStartOfNextLocalDay,
  getStartOfNextLocalWeek,
  getWeekSeed,
  scoreTrack,
  shuffle,
  toMixShape,
  type MixShape,
} from "./mix-algo"

const MIX_LIMIT = 25
const DAILY_MIX_ID = "daily"
const FOR_YOU_MIX_ID = "for-you"

export { MIX_SHAPES } from "./mix-algo"
export type { MixShape } from "./mix-algo"

export type PersistedMix = {
  id: string
  kind: string
  title: string
  timespan: string | null
  colorIndex: number
  shape: MixShape
  generatedAt: number
  expiresAt: number
  tracks: Track[]
}

async function listLibraryTracks(): Promise<DBTrack[]> {
  const rows = await db.query.tracks.findMany({
    where: eq(tracks.isDeleted, 0),
    orderBy: [desc(tracks.playCount), desc(tracks.lastPlayedAt)],
    with: {
      artist: true,
      featuredArtists: {
        with: {
          artist: true,
        },
      },
      album: true,
      genres: {
        with: {
          genre: true,
        },
      },
    },
    limit: 300,
  })

  return rows as DBTrack[]
}

async function generateMix(seedTracks: Track[], seed: number): Promise<Track[]> {
  const profile = buildProfile(seedTracks)
  const libraryTracks = (await listLibraryTracks()).map((track) => transformDBTrackToTrack(track))

  const ranked = libraryTracks
    .map((track) => ({ track, score: scoreTrack(track, profile) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 60)
    .map((entry) => entry.track)

  return shuffle(ranked, seed).slice(0, MIX_LIMIT)
}

async function loadPersistedMixTracks(mixId: string): Promise<Track[]> {
  const rows = await db.query.mixTracks.findMany({
    where: eq(mixTracks.mixId, mixId),
    orderBy: [asc(mixTracks.position)],
    with: {
      track: {
        with: {
          artist: true,
          featuredArtists: {
            with: {
              artist: true,
            },
          },
          album: true,
          genres: {
            with: {
              genre: true,
            },
          },
        },
      },
    },
  })

  return rows
    .map((row) => row.track)
    .filter((track): track is DBTrack => Boolean(track && !track.isDeleted))
    .map((track) => transformDBTrackToTrack(track))
}

function toPersistedMix(row: typeof mixes.$inferSelect, tracksList: Track[]): PersistedMix {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    timespan: row.timespan,
    colorIndex: row.colorIndex,
    shape: toMixShape(row.shape),
    generatedAt: row.generatedAt,
    expiresAt: row.expiresAt,
    tracks: tracksList,
  }
}

async function persistMix(params: {
  id: string
  kind: string
  title: string
  timespan: string
  expiresAt: number
  tracks: Track[]
  colorIndex: number
  shape: MixShape
}) {
  const now = Date.now()

  await db.transaction(async (tx) => {
    await tx
      .insert(mixes)
      .values({
        id: params.id,
        kind: params.kind,
        title: params.title,
        timespan: params.timespan,
        colorIndex: params.colorIndex,
        shape: params.shape,
        generatedAt: now,
        expiresAt: params.expiresAt,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: mixes.id,
        set: {
          kind: params.kind,
          title: params.title,
          timespan: params.timespan,
          colorIndex: params.colorIndex,
          shape: params.shape,
          generatedAt: now,
          expiresAt: params.expiresAt,
          updatedAt: now,
        },
      })

    await tx.delete(mixTracks).where(eq(mixTracks.mixId, params.id))

    if (params.tracks.length === 0) {
      return
    }

    await tx.insert(mixTracks).values(
      params.tracks.map((track, index) => ({
        id: createId(),
        mixId: params.id,
        trackId: track.id,
        position: index,
        addedAt: now,
      }))
    )
  })
}

async function getPersistedMixIfFresh(mixId: string) {
  const mix = await db.query.mixes.findFirst({
    where: eq(mixes.id, mixId),
  })

  if (!mix || mix.expiresAt <= Date.now()) {
    return null
  }

  const persistedTracks = await loadPersistedMixTracks(mixId)
  if (persistedTracks.length === 0) {
    return null
  }

  return toPersistedMix(mix, persistedTracks)
}

async function generateDailyMixTracks(seed: number) {
  const recent = await db.query.playHistory.findMany({
    orderBy: [desc(playHistory.playedAt)],
    with: {
      track: {
        with: {
          artist: true,
          featuredArtists: {
            with: {
              artist: true,
            },
          },
          album: true,
          genres: {
            with: {
              genre: true,
            },
          },
        },
      },
    },
    limit: 40,
  })

  const seedTracks = recent
    .map((entry) => entry.track)
    .filter((track): track is DBTrack => Boolean(track && !track.isDeleted))
    .map((track) => transformDBTrackToTrack(track))

  if (seedTracks.length === 0) {
    return shuffle(
      (await listLibraryTracks()).map((track) => transformDBTrackToTrack(track)),
      seed
    ).slice(0, MIX_LIMIT)
  }

  return generateMix(seedTracks, seed)
}

async function generateForYouMixTracks(seed: number) {
  const topLibraryTracks = (await listLibraryTracks())
    .filter((track) => (track.playCount ?? 0) > 0)
    .slice(0, 50)
    .map((track) => transformDBTrackToTrack(track))

  if (topLibraryTracks.length === 0) {
    return shuffle(
      (await listLibraryTracks()).map((track) => transformDBTrackToTrack(track)),
      seed
    ).slice(0, MIX_LIMIT)
  }

  return generateMix(topLibraryTracks, seed)
}

export async function getDailyMix(): Promise<PersistedMix> {
  const persisted = await getPersistedMixIfFresh(DAILY_MIX_ID)
  if (persisted) {
    return persisted
  }

  const seed = getDaySeed()
  const forYouMixRow = await db.query.mixes.findFirst({ where: eq(mixes.id, FOR_YOU_MIX_ID) })
  const reserved = forYouMixRow
    ? { colorIndex: forYouMixRow.colorIndex, shape: toMixShape(forYouMixRow.shape) }
    : undefined
  const visual = getMixVisual(seed, reserved)
  const mixTracksList = await generateDailyMixTracks(seed)

  await persistMix({
    id: DAILY_MIX_ID,
    kind: "system",
    title: "Daily Mix",
    timespan: "day",
    expiresAt: getStartOfNextLocalDay(),
    tracks: mixTracksList,
    ...visual,
  })

  return {
    id: DAILY_MIX_ID,
    kind: "system",
    title: "Daily Mix",
    timespan: "day",
    generatedAt: Date.now(),
    expiresAt: getStartOfNextLocalDay(),
    tracks: mixTracksList,
    ...visual,
  }
}

export async function getForYouMix(): Promise<PersistedMix> {
  const persisted = await getPersistedMixIfFresh(FOR_YOU_MIX_ID)
  if (persisted) {
    return persisted
  }

  const seed = getWeekSeed()
  const dailyMixRow = await db.query.mixes.findFirst({ where: eq(mixes.id, DAILY_MIX_ID) })
  const reserved = dailyMixRow
    ? { colorIndex: dailyMixRow.colorIndex, shape: toMixShape(dailyMixRow.shape) }
    : undefined
  const visual = getMixVisual(seed, reserved)
  const mixTracksList = await generateForYouMixTracks(seed)

  await persistMix({
    id: FOR_YOU_MIX_ID,
    kind: "system",
    title: "For You Mix",
    timespan: "week",
    expiresAt: getStartOfNextLocalWeek(),
    tracks: mixTracksList,
    ...visual,
  })

  return {
    id: FOR_YOU_MIX_ID,
    kind: "system",
    title: "For You Mix",
    timespan: "week",
    generatedAt: Date.now(),
    expiresAt: getStartOfNextLocalWeek(),
    tracks: mixTracksList,
    ...visual,
  }
}

export async function forceUpdateMixes(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(mixTracks)
    await tx.delete(mixes)
  })
}

export async function getMixTrackIds(mixId: string): Promise<Array<{ id: string }>> {
  const rows = await db
    .select({ trackId: mixTracks.trackId })
    .from(mixTracks)
    .where(eq(mixTracks.mixId, mixId))
    .orderBy(asc(mixTracks.position))
  return rows.map((r) => ({ id: r.trackId }))
}
