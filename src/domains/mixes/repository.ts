/* oxlint-disable anti-slop/no-shape-in-symbol-names -- "shape" is this app's domain vocabulary for genre/mix visual patterns */
import { createId } from "@paralleldrive/cuid2"
import { asc, desc, eq } from "drizzle-orm"

import { db } from "@/core/db"
import { mixTracks, mixes, playHistory, tracks } from "@/core/db/schema"
import { getPreferenceState } from "@/core/preferences/store"
import { toDataTrack } from "@/domains/tracks/repository"
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
  type MixCandidate,
} from "./mix-algo"
import { toPlayerTrack } from "@/playback/player-track"
import type { PlayerTrack } from "@/playback/types"

const MIX_LIMIT = 25
const DAILY_MIX_ID = "daily"
const FOR_YOU_MIX_ID = "for-you"
const LIBRARY_POOL_LIMIT = 300

export type PersistedMix = {
  id: string
  kind: string
  title: string
  timespan: string | null
  colorIndex: number
  shape: ReturnType<typeof toMixShape>
  generatedAt: number
  expiresAt: number
  tracks: PlayerTrack[]
}

type TrackRowWithRelations = {
  id: string
  title: string
  artwork: string | null
  albumId: string | null
  uri: string
  duration: number
  dateAdded: number | null
  scanTime: number | null
  rawArtist: string | null
  playCount: number | null
  isDeleted: number
  artist: { name: string } | null
  album: { title: string } | null
  genres: Array<{ genre: { name: string } | null }>
}

const trackRelations = {
  artist: true,
  album: true,
  genres: { with: { genre: true } },
} as const

type MixPoolEntry = MixCandidate & { track: PlayerTrack }

function toMixPoolEntry(row: TrackRowWithRelations): MixPoolEntry | null {
  const track = toPlayerTrack(
    toDataTrack({
      id: row.id,
      title: row.title,
      artwork: row.artwork,
      albumId: row.albumId,
      uri: row.uri,
      duration: row.duration,
      dateAdded: row.dateAdded,
      scanTime: row.scanTime,
      rawArtist: row.rawArtist,
      albumName: row.album?.title ?? null,
      artistName: row.artist?.name ?? null,
    }),
    getPreferenceState().splitMultipleValueConfig
  )

  if (!track) {
    return null
  }

  return {
    id: row.id,
    artist: row.artist?.name ?? undefined,
    genres: row.genres
      .map((entry) => entry.genre?.name)
      .filter((name): name is string => Boolean(name)),
    playCount: row.playCount ?? 0,
    track,
  }
}

async function listLibraryCandidates(): Promise<MixPoolEntry[]> {
  // SAFETY: library rows come from this app's own SQLite schema with artist/album/genre relations registered on the db client, so every joined row matches TrackRowWithRelations
  const rows = (await db.query.tracks.findMany({
    where: eq(tracks.isDeleted, 0),
    orderBy: [desc(tracks.playCount), desc(tracks.lastPlayedAt)],
    with: trackRelations,
    limit: LIBRARY_POOL_LIMIT,
  })) as TrackRowWithRelations[]

  return rows.map(toMixPoolEntry).filter((entry): entry is MixPoolEntry => entry !== null)
}

function candidatesToTracks(
  candidates: Array<MixCandidate & { track: PlayerTrack }>
): PlayerTrack[] {
  return candidates.map((candidate) => candidate.track)
}

async function generateMixCandidates(
  seedCandidates: MixCandidate[],
  seed: number
): Promise<PlayerTrack[]> {
  const profile = buildProfile(seedCandidates)
  const libraryCandidates = await listLibraryCandidates()

  const ranked = libraryCandidates
    .map((candidate) => ({ candidate, score: scoreTrack(candidate, profile) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 60)
    .map((entry) => entry.candidate)

  return shuffle(candidatesToTracks(ranked), seed).slice(0, MIX_LIMIT)
}

async function loadPersistedMixTracks(mixId: string): Promise<PlayerTrack[]> {
  // SAFETY: mixTracks rows reference tracks in the same app-managed schema, so the joined track relation resolves to TrackRowWithRelations or is absent
  const rows = (await db.query.mixTracks.findMany({
    where: eq(mixTracks.mixId, mixId),
    orderBy: [asc(mixTracks.position)],
    with: { track: { with: trackRelations } },
  })) as Array<{ track: TrackRowWithRelations | null }>

  return rows
    .map((row) => row.track)
    .filter((track): track is TrackRowWithRelations => Boolean(track && !track.isDeleted))
    .map((row) => toMixPoolEntry(row)?.track)
    .filter((track): track is PlayerTrack => track !== null)
}

function toPersistedMix(row: typeof mixes.$inferSelect, tracksList: PlayerTrack[]): PersistedMix {
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
  tracks: PlayerTrack[]
  colorIndex: number
  shape: ReturnType<typeof toMixShape>
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

async function generateDailyMixTracks(seed: number): Promise<PlayerTrack[]> {
  // SAFETY: playHistory rows reference tracks in the same app-managed schema, so the joined track relation resolves to TrackRowWithRelations or is absent
  const recent = (await db.query.playHistory.findMany({
    orderBy: [desc(playHistory.playedAt)],
    limit: 40,
    with: { track: { with: trackRelations } },
  })) as Array<{ track: TrackRowWithRelations | null }>

  const seedCandidates = recent
    .map((entry) => entry.track)
    .filter((track): track is TrackRowWithRelations => Boolean(track && !track.isDeleted))
    .map(toMixPoolEntry)
    .filter((entry): entry is MixPoolEntry => entry !== null)

  if (seedCandidates.length === 0) {
    return shuffle(candidatesToTracks(await listLibraryCandidates()), seed).slice(0, MIX_LIMIT)
  }

  return generateMixCandidates(seedCandidates, seed)
}

async function generateForYouMixTracks(seed: number): Promise<PlayerTrack[]> {
  const topCandidates = (await listLibraryCandidates())
    .filter((candidate) => (candidate.playCount ?? 0) > 0)
    .slice(0, 50)

  if (topCandidates.length === 0) {
    return shuffle(candidatesToTracks(await listLibraryCandidates()), seed).slice(0, MIX_LIMIT)
  }

  return generateMixCandidates(topCandidates, seed)
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
