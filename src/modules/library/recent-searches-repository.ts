import { createId } from "@paralleldrive/cuid2"
import { and, asc, eq, gt, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { albums, appSettings, artists, playlists, playlistTracks } from "@/db/schema"
import { collectPlaylistImages } from "@/modules/playlist/repository"
import type { AddRecentSearchInput, RecentSearchEntry } from "./types"

function normalizeLookup(value: string | null | undefined) {
  return (value || "").trim().toLowerCase()
}

const RECENT_SEARCHES_SETTINGS_KEY = "library:recent-searches"
const MAX_RECENT_SEARCHES = 30

function normalizeRecentSearchQuery(value: string | null | undefined) {
  return (value || "").trim()
}

function getRecentSearchDedupeKey(item: {
  type?: RecentSearchEntry["type"]
  targetId?: string
  query: string
}) {
  const normalizedTargetId = normalizeRecentSearchQuery(item.targetId)
  if (item.type && normalizedTargetId) {
    return `${item.type}:${normalizedTargetId.toLowerCase()}`
  }

  return `${item.type || "query"}:${item.query.toLowerCase()}`
}

function createRecentSearchId() {
  return createId()
}

function isRecentSearchType(value: unknown): value is RecentSearchEntry["type"] {
  return value === "track" || value === "album" || value === "artist" || value === "playlist"
}

function normalizeRecentSearchEntry(value: unknown): RecentSearchEntry | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const entry = value as Partial<RecentSearchEntry>
  const query = normalizeRecentSearchQuery(entry.query)
  if (!query) {
    return null
  }

  const title = normalizeRecentSearchQuery(entry.title) || query
  const subtitle = normalizeRecentSearchQuery(entry.subtitle) || "Search"
  const id = normalizeRecentSearchQuery(entry.id) || createRecentSearchId()
  const targetId = normalizeRecentSearchQuery(entry.targetId) || undefined
  const image = normalizeRecentSearchQuery(entry.image) || undefined
  const images = Array.isArray(entry.images)
    ? entry.images
        .map((candidate) => normalizeRecentSearchQuery(candidate))
        .filter((candidate): candidate is string => Boolean(candidate))
    : undefined
  const createdAt =
    typeof entry.createdAt === "number" && Number.isFinite(entry.createdAt)
      ? entry.createdAt
      : Date.now()

  return {
    id,
    query,
    title,
    subtitle,
    type: isRecentSearchType(entry.type) ? entry.type : undefined,
    targetId,
    image,
    images,
    createdAt,
  }
}

function parseRecentSearches(raw: string): RecentSearchEntry[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    const normalized = parsed
      .map(normalizeRecentSearchEntry)
      .filter((item): item is RecentSearchEntry => item !== null)
      .sort((left, right) => right.createdAt - left.createdAt)

    const seenQueries = new Set<string>()
    const deduped: RecentSearchEntry[] = []
    for (const item of normalized) {
      const key = getRecentSearchDedupeKey(item)
      if (seenQueries.has(key)) {
        continue
      }

      seenQueries.add(key)
      deduped.push(item)

      if (deduped.length >= MAX_RECENT_SEARCHES) {
        break
      }
    }

    return deduped
  } catch {
    return []
  }
}

async function readRecentSearches(): Promise<RecentSearchEntry[]> {
  const row = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, RECENT_SEARCHES_SETTINGS_KEY),
  })

  if (!row) {
    return []
  }

  return parseRecentSearches(row.value)
}

async function writeRecentSearches(items: RecentSearchEntry[]): Promise<void> {
  const now = Date.now()
  const payload = JSON.stringify(items.slice(0, MAX_RECENT_SEARCHES))

  await db
    .insert(appSettings)
    .values({
      key: RECENT_SEARCHES_SETTINGS_KEY,
      value: payload,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value: payload,
        updatedAt: now,
      },
    })
}

function areRecentSearchItemsEqual(left: RecentSearchEntry, right: RecentSearchEntry) {
  return (
    left.id === right.id &&
    left.query === right.query &&
    left.title === right.title &&
    left.subtitle === right.subtitle &&
    left.type === right.type &&
    left.targetId === right.targetId &&
    left.image === right.image &&
    JSON.stringify(left.images || []) === JSON.stringify(right.images || []) &&
    left.createdAt === right.createdAt
  )
}

async function hydrateRecentSearchEntry(item: RecentSearchEntry): Promise<RecentSearchEntry> {
  const normalizedQuery = normalizeLookup(item.query)
  if (!normalizedQuery || !item.type) {
    return item
  }

  if (item.type === "artist") {
    const artist = item.targetId
      ? await db.query.artists.findFirst({
          where: eq(artists.id, item.targetId),
          columns: {
            id: true,
            name: true,
            artwork: true,
          },
        })
      : await db.query.artists.findFirst({
          where: and(
            gt(artists.trackCount, 0),
            eq(sql`lower(coalesce(${artists.name}, ''))`, normalizedQuery)
          ),
          columns: {
            id: true,
            name: true,
            artwork: true,
          },
        })

    if (!artist) {
      return item
    }

    return {
      ...item,
      query: artist.name || item.query,
      title: artist.name || item.title,
      targetId: artist.id,
      image: item.image || artist.artwork || undefined,
    }
  }

  if (item.type === "album") {
    const album = item.targetId
      ? await db.query.albums.findFirst({
          where: eq(albums.id, item.targetId),
          columns: {
            id: true,
            title: true,
            artwork: true,
          },
        })
      : await db.query.albums.findFirst({
          where: and(
            gt(albums.trackCount, 0),
            eq(sql`lower(coalesce(${albums.title}, ''))`, normalizedQuery)
          ),
          columns: {
            id: true,
            title: true,
            artwork: true,
          },
        })

    if (!album) {
      return item
    }

    return {
      ...item,
      query: album.title || item.query,
      title: album.title || item.title,
      targetId: album.id,
      image: item.image || album.artwork || undefined,
    }
  }

  if (item.type === "playlist") {
    const playlist = item.targetId
      ? await db.query.playlists.findFirst({
          where: eq(playlists.id, item.targetId),
          columns: {
            id: true,
            name: true,
            artwork: true,
          },
          with: {
            tracks: {
              limit: 1,
              orderBy: [asc(playlistTracks.position)],
              with: {
                track: {
                  with: {
                    album: {
                      with: {
                        artist: true,
                      },
                    },
                  },
                },
              },
            },
          },
        })
      : await db.query.playlists.findFirst({
          where: eq(sql`lower(coalesce(${playlists.name}, ''))`, normalizedQuery),
          columns: {
            id: true,
            name: true,
            artwork: true,
          },
          with: {
            tracks: {
              limit: 1,
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

    if (!playlist) {
      return item
    }

    const nextImages = new Set<string>([...(item.images || []), ...collectPlaylistImages(playlist)])

    return {
      ...item,
      query: playlist.name || item.query,
      title: playlist.name || item.title,
      targetId: playlist.id,
      image: item.image || playlist.artwork || undefined,
      images: Array.from(nextImages).slice(0, 4),
    }
  }

  return item
}

async function hydrateRecentSearches(items: RecentSearchEntry[]): Promise<RecentSearchEntry[]> {
  const hydrated: RecentSearchEntry[] = []

  for (const item of items) {
    hydrated.push(await hydrateRecentSearchEntry(item))
  }

  return hydrated
}

export async function getRecentSearches() {
  const existing = await readRecentSearches()
  const hydrated = await hydrateRecentSearches(existing)

  const changed =
    existing.length !== hydrated.length ||
    existing.some((item, index) => !areRecentSearchItemsEqual(item, hydrated[index]!))

  if (changed) {
    await writeRecentSearches(hydrated)
  }

  return hydrated
}

export async function addRecentSearch(input: AddRecentSearchInput): Promise<RecentSearchEntry[]> {
  const query = normalizeRecentSearchQuery(input.query)
  if (!query) {
    return readRecentSearches()
  }

  const now = Date.now()
  const title = normalizeRecentSearchQuery(input.title) || query
  const subtitle = normalizeRecentSearchQuery(input.subtitle) || "Search"
  const targetId = normalizeRecentSearchQuery(input.targetId) || undefined
  const image = normalizeRecentSearchQuery(input.image) || undefined
  const images = Array.isArray(input.images)
    ? input.images
        .map((candidate) => normalizeRecentSearchQuery(candidate))
        .filter((candidate): candidate is string => Boolean(candidate))
    : undefined
  const existing = await readRecentSearches()
  const dedupeKey = getRecentSearchDedupeKey({
    type: input.type,
    targetId,
    query,
  })
  const existingMatch = existing.find((item) => getRecentSearchDedupeKey(item) === dedupeKey)

  const nextItem: RecentSearchEntry = {
    id: existingMatch?.id || createRecentSearchId(),
    query,
    title,
    subtitle,
    type: input.type,
    targetId,
    image,
    images,
    createdAt: now,
  }

  const nextItems = [
    nextItem,
    ...existing.filter((item) => getRecentSearchDedupeKey(item) !== dedupeKey),
  ].slice(0, MAX_RECENT_SEARCHES)

  await writeRecentSearches(nextItems)
  return nextItems
}

export async function deleteRecentSearch(id: string): Promise<RecentSearchEntry[]> {
  const normalizedId = normalizeRecentSearchQuery(id)
  if (!normalizedId) {
    return readRecentSearches()
  }

  const existing = await readRecentSearches()
  const nextItems = existing.filter((item) => item.id !== normalizedId)

  if (nextItems.length === 0) {
    await clearRecentSearches()
    return []
  }

  await writeRecentSearches(nextItems)
  return nextItems
}

export async function clearRecentSearches() {
  await db.delete(appSettings).where(eq(appSettings.key, RECENT_SEARCHES_SETTINGS_KEY))
}
