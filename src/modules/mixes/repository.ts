import type { Track } from "@/modules/player/types"
import { desc, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { tracks } from "@/db/schema"
import type { DBTrack } from "@/types/database"
import { transformDBTrackToTrack } from "@/utils/transformers"

const MIX_LIMIT = 25

type MixProfile = {
  artistNames: string[]
  genreNames: string[]
}

function shuffle<T>(items: T[], seed = Date.now()) {
  const next = [...items]
  let currentSeed = seed

  for (let index = next.length - 1; index > 0; index -= 1) {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    const swapIndex = Math.floor((currentSeed / 233280) * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next
}

function getSeedFromDay(dayOffset = 0) {
  const now = new Date()
  return Number(`${now.getFullYear()}${now.getMonth() + 1}${now.getDate() + dayOffset}`)
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

function buildProfile(sourceTracks: Track[]): MixProfile {
  const artistCounts = new Map<string, number>()
  const genreCounts = new Map<string, number>()

  for (const track of sourceTracks) {
    if (track.artist) {
      artistCounts.set(track.artist, (artistCounts.get(track.artist) ?? 0) + 1)
    }

    for (const genre of track.genre ? track.genre.split(", ") : []) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1)
    }
  }

  return {
    artistNames: [...artistCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name),
    genreNames: [...genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name),
  }
}

function scoreTrack(track: Track, profile: MixProfile) {
  let score = 0

  if (track.artist && profile.artistNames.includes(track.artist)) {
    score += 4
  }

  for (const genre of track.genre ? track.genre.split(", ") : []) {
    if (profile.genreNames.includes(genre)) {
      score += 2
    }
  }

  score += Math.min(track.playCount ?? 0, 10) * 0.15
  return score
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

export async function getDailyMix(): Promise<Track[]> {
  const recent = await db.query.playHistory.findMany({
    orderBy: [],
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
    return shuffle((await listLibraryTracks()).map((track) => transformDBTrackToTrack(track)), getSeedFromDay()).slice(0, MIX_LIMIT)
  }

  return generateMix(seedTracks, getSeedFromDay())
}

export async function getForYouMix(): Promise<Track[]> {
  const topLibraryTracks = (await listLibraryTracks())
    .filter((track) => (track.playCount ?? 0) > 0)
    .slice(0, 50)
    .map((track) => transformDBTrackToTrack(track))

  if (topLibraryTracks.length === 0) {
    return shuffle((await listLibraryTracks()).map((track) => transformDBTrackToTrack(track)), getSeedFromDay(7)).slice(0, MIX_LIMIT)
  }

  return generateMix(topLibraryTracks, getSeedFromDay(7))
}
