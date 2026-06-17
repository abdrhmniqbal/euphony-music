/**
 * Purpose: Sets up AudioBrowser playback, plays indexed tracks, indexes external intent files on demand, and stores queue source context when playback starts.
 * Caller: track rows, player controls, queue recovery flows, bootstrap playback setup, external audio intent handler.
 * Dependencies: AudioBrowser playback core, player store, playback session service, player activity service, crossfade transition service, metadata/artwork helpers, file URI utilities, logging service.
 * Main Functions: setupPlayer(), playTrack(), playExternalFileUri()
 * Side Effects: Initializes native playback, reads external file metadata/artwork, writes newly opened external files to the library database, resets playback context and volume transitions, starts playback, persists session state.
 */

import { and, eq, inArray, or, sql, type SQL } from "drizzle-orm"
import { db } from "@/db/client"
import {
  albums,
  artists,
  genres,
  trackArtists,
  trackGenres,
  tracks as tracksTable,
} from "@/db/schema"
import { extractMetadata, saveArtworkToCache } from "@/modules/indexer/metadata"
import { logError, logInfo, logWarn } from "@/modules/logging/service"
import { handleTrackActivated } from "@/modules/player/activity"
import {
  EXTERNAL_TRACK_ID_PREFIX,
  type PlayerQueueContext,
  type Track,
} from "@/modules/player/types"
import { resetCrossfadeVolume } from "@/modules/player/crossfade"
import { ensureSplitMultipleValueConfigLoaded } from "@/modules/settings/split-multiple-values"
import {
  beginPlayerQueueReplacement,
  endPlayerQueueReplacement,
} from "@/modules/player/runtime"
import { persistPlaybackSession } from "@/modules/player/session.service"
import { resolvePlayableFileUri } from "@/utils/file-path"
import { generateId } from "@/utils/common"
import { transformDBTrackToTrack } from "@/utils/transformers"

import {
  playFromTracks,
  setupPlaybackCore,
} from "@/modules/player/playback-core"
import { playbackStore } from "@/stores/playback/store"
import { preferenceStore } from "@/stores/preference/store"

import { getIsShuffledState, getTracksState, setTracksState } from "./store"

let isPlayerReady = false

function decodeUriRecursively(value: string) {
  let decodedValue = value

  for (let iteration = 0; iteration < 3; iteration += 1) {
    try {
      const nextValue = decodeURIComponent(decodedValue)
      if (nextValue === decodedValue) {
        break
      }
      decodedValue = nextValue
    } catch {
      break
    }
  }

  return decodedValue
}

function normalizeExternalIntentUri(uri: string) {
  const decodedUri = decodeUriRecursively(uri).trim()

  if (/^content:\/(?!\/)/i.test(decodedUri)) {
    return decodedUri.replace(/^content:\//i, "content://")
  }

  if (/^file:\/(?!\/)/i.test(decodedUri)) {
    return decodedUri.replace(/^file:\//i, "file:///")
  }

  return decodedUri
}

function normalizeUriForComparison(uri: string) {
  const decodedUri = decodeUriRecursively(uri).trim()
  const withoutQuery = decodedUri.split(/[?#]/)[0] ?? decodedUri

  return withoutQuery.replace(/\/+$/, "")
}

function extractExternalUriTrackIds(uri: string) {
  const decodedUri = decodeUriRecursively(uri)
  const candidates = new Set<string>()
  const documentIdMatch = decodedUri.match(
    /(?:document|tree)\/audio:([^/?#]+)/i
  )
  const mediaStoreIdMatch = decodedUri.match(/\/audio\/media\/([^/?#]+)/i)
  const genericMediaIdMatch = decodedUri.match(/\/media\/([^/?#]+)/i)

  const addCandidate = (value?: string) => {
    const decodedValue = value ? decodeUriRecursively(value).trim() : ""
    if (decodedValue) {
      candidates.add(decodedValue)
    }
  }

  addCandidate(documentIdMatch?.[1])
  addCandidate(mediaStoreIdMatch?.[1])
  addCandidate(genericMediaIdMatch?.[1])

  return candidates
}

function getExternalTrackTitle(uri: string) {
  const normalizedUri = decodeUriRecursively(uri)
  const pathWithoutQuery = normalizedUri.split(/[?#]/)[0] ?? normalizedUri
  const filename = pathWithoutQuery.split("/").filter(Boolean).at(-1) ?? ""
  const title = filename.replace(/\.[^.]+$/, "").trim()

  return title || normalizedUri
}

function getExternalFilename(uri: string) {
  const normalizedUri = decodeUriRecursively(uri)
  const pathWithoutQuery = normalizedUri.split(/[?#]/)[0] ?? normalizedUri
  return pathWithoutQuery.split("/").filter(Boolean).at(-1) ?? normalizedUri
}

function hashExternalTrackId(uri: string) {
  let hashA = 5381
  let hashB = 52711

  for (let index = 0; index < uri.length; index += 1) {
    const char = uri.charCodeAt(index)
    hashA = ((hashA << 5) + hashA) ^ char
    hashB = ((hashB << 5) + hashB) ^ (char + index)
  }

  const partA = (hashA >>> 0).toString(16).padStart(8, "0")
  const partB = (hashB >>> 0).toString(16).padStart(8, "0")
  return `external-indexed:${partA}${partB}`
}

function generateSortName(name: string) {
  return name.replace(/^(the|a|an)\s+/i, "").trim() || name
}

async function getOrCreateExternalArtist(name: string) {
  const existing = await db.query.artists.findFirst({
    where: eq(artists.name, name),
  })

  if (existing) {
    return existing.id
  }

  const id = generateId()
  await db.insert(artists).values({
    id,
    name,
    sortName: generateSortName(name),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })

  return id
}

async function getOrCreateExternalAlbum(
  title: string,
  artistId: string,
  artwork?: string,
  year?: number
) {
  const existing = await db.query.albums.findFirst({
    where: and(eq(albums.title, title), eq(albums.artistId, artistId)),
  })

  if (existing) {
    return existing.id
  }

  const id = generateId()
  await db.insert(albums).values({
    id,
    title,
    artistId,
    year: year || null,
    artwork: artwork || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })

  return id
}

async function getOrCreateExternalGenre(name: string) {
  const existing = await db.query.genres.findFirst({
    where: eq(genres.name, name),
  })

  if (existing) {
    return existing.id
  }

  const id = generateId()
  await db.insert(genres).values({
    id,
    name,
    createdAt: Date.now(),
  })

  return id
}

async function updateExternalLibraryCounts() {
  await db.run(sql`
    UPDATE artists
    SET track_count = (
      SELECT COUNT(DISTINCT t.id)
      FROM tracks t
      LEFT JOIN track_artists ta ON ta.track_id = t.id
      WHERE t.is_deleted = 0
        AND (t.artist_id = artists.id OR ta.artist_id = artists.id)
    )
  `)
  await db.run(sql`
    UPDATE albums
    SET track_count = (
      SELECT COUNT(*)
      FROM tracks t
      WHERE t.album_id = albums.id AND t.is_deleted = 0
    ),
    duration = (
      SELECT COALESCE(SUM(t.duration), 0)
      FROM tracks t
      WHERE t.album_id = albums.id AND t.is_deleted = 0
    )
  `)
  await db.run(sql`
    UPDATE genres
    SET track_count = (
      SELECT COUNT(*)
      FROM track_genres tg
      JOIN tracks t ON tg.track_id = t.id
      WHERE tg.genre_id = genres.id AND t.is_deleted = 0
    )
  `)
}

async function buildExternalTrack(
  uri: string,
  resolvedUri: string
): Promise<Track> {
  const fallbackTitle = getExternalTrackTitle(uri)
  const playableUri = resolvedUri || uri
  const fallbackTrack: Track = {
    id: `${EXTERNAL_TRACK_ID_PREFIX}${Date.now()}:${playableUri}`,
    title: fallbackTitle,
    duration: 0,
    uri: playableUri,
    isExternal: true,
  }

  try {
    const splitConfig = await ensureSplitMultipleValueConfigLoaded()
    const metadata = await extractMetadata(
      playableUri,
      getExternalFilename(uri),
      0,
      splitConfig
    )
    const artworkPath = await saveArtworkToCache(metadata.artwork)

    return {
      ...fallbackTrack,
      title: metadata.title || fallbackTitle,
      artist: metadata.artist,
      albumArtist: metadata.albumArtist,
      album: metadata.album,
      duration: metadata.duration,
      image: artworkPath,
      albumArtwork: artworkPath,
      audioBitrate: metadata.bitrate,
      audioSampleRate: metadata.sampleRate,
      audioCodec: metadata.codec,
      audioFormat: metadata.format,
      lyrics: metadata.lyrics,
      year: metadata.year,
      discNumber: metadata.discNumber,
      trackNumber: metadata.trackNumber,
      genre: metadata.genres[0],
    }
  } catch (error) {
    logWarn("Failed to read external file metadata", {
      uri: playableUri,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  return {
    ...fallbackTrack,
  }
}

async function indexExternalFileTrack(uri: string, resolvedUri: string) {
  const playableUri = resolvedUri || uri
  const trackId =
    Array.from(extractExternalUriTrackIds(uri))[0] ||
    hashExternalTrackId(normalizeUriForComparison(playableUri || uri))
  const existingTrack = await findIndexedTrackForExternalUri(uri, resolvedUri)

  if (existingTrack) {
    return existingTrack
  }

  const splitConfig = await ensureSplitMultipleValueConfigLoaded()
  const metadata = await extractMetadata(
    playableUri,
    getExternalFilename(uri),
    0,
    splitConfig
  )
  const artworkPath = await saveArtworkToCache(metadata.artwork)
  const artistId = metadata.artist
    ? await getOrCreateExternalArtist(metadata.artist)
    : null
  const relationArtistNames = metadata.artists.length
    ? metadata.artists
    : metadata.artist
      ? [metadata.artist]
      : []
  const relationArtistIds = Array.from(
    new Set(
      await Promise.all(
        [...relationArtistNames, metadata.artist ?? ""]
          .filter((artist): artist is string => Boolean(artist))
          .map((artist) => getOrCreateExternalArtist(artist))
      )
    )
  )
  const albumArtistId =
    metadata.albumArtist && metadata.albumArtist !== metadata.artist
      ? await getOrCreateExternalArtist(metadata.albumArtist)
      : artistId
  const albumId =
    metadata.album && albumArtistId
      ? await getOrCreateExternalAlbum(
          metadata.album,
          albumArtistId,
          artworkPath,
          metadata.year
        )
      : null
  const genreNames = metadata.genres.length > 0 ? metadata.genres : ["Unknown"]
  const genreIds = await Promise.all(
    genreNames.map((genre) => getOrCreateExternalGenre(genre))
  )
  const now = Date.now()

  await db
    .insert(tracksTable)
    .values({
      id: trackId,
      title: metadata.title || getExternalTrackTitle(uri),
      artistId,
      albumId,
      duration: metadata.duration,
      uri: playableUri,
      trackNumber: metadata.trackNumber,
      discNumber: metadata.discNumber,
      year: metadata.year,
      filename: getExternalFilename(uri),
      fileHash: hashExternalTrackId(normalizeUriForComparison(playableUri)),
      audioBitrate: metadata.bitrate || null,
      audioSampleRate: metadata.sampleRate || null,
      audioCodec: metadata.codec || null,
      audioFormat: metadata.format || null,
      artwork: artworkPath || null,
      lyrics: metadata.lyrics || null,
      composer: metadata.composer || null,
      comment: metadata.comment || null,
      rawArtist: metadata.rawArtist || null,
      rawAlbumArtist: metadata.rawAlbumArtist || null,
      rawGenre: metadata.rawGenre || null,
      dateAdded: now,
      scanTime: now,
      isDeleted: 0,
      isFavorite: 0,
      playCount: 0,
      rating: null,
      lastPlayedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: tracksTable.id,
      set: {
        title: metadata.title || getExternalTrackTitle(uri),
        artistId,
        albumId,
        duration: metadata.duration,
        uri: playableUri,
        trackNumber: metadata.trackNumber,
        discNumber: metadata.discNumber,
        year: metadata.year,
        filename: getExternalFilename(uri),
        fileHash: hashExternalTrackId(normalizeUriForComparison(playableUri)),
        audioBitrate: metadata.bitrate || null,
        audioSampleRate: metadata.sampleRate || null,
        audioCodec: metadata.codec || null,
        audioFormat: metadata.format || null,
        artwork: artworkPath || null,
        lyrics: metadata.lyrics || null,
        composer: metadata.composer || null,
        comment: metadata.comment || null,
        rawArtist: metadata.rawArtist || null,
        rawAlbumArtist: metadata.rawAlbumArtist || null,
        rawGenre: metadata.rawGenre || null,
        scanTime: now,
        isDeleted: 0,
        updatedAt: now,
      },
    })

  await db.delete(trackGenres).where(eq(trackGenres.trackId, trackId))
  await db.delete(trackArtists).where(eq(trackArtists.trackId, trackId))

  if (relationArtistIds.length > 0) {
    await db.insert(trackArtists).values(
      relationArtistIds.map((artistIdValue) => ({
        trackId,
        artistId: artistIdValue,
      }))
    )
  }

  if (genreIds.length > 0) {
    await db.insert(trackGenres).values(
      genreIds.map((genreId) => ({
        trackId,
        genreId,
      }))
    )
  }

  await updateExternalLibraryCounts()

  const indexedTrack = await findIndexedTrackForExternalUri(uri, resolvedUri)
  if (!indexedTrack) {
    throw new Error("External file was indexed but could not be read back")
  }

  return indexedTrack
}

async function findIndexedTrackForExternalUri(
  uri: string,
  resolvedUri: string
) {
  const uriCandidates = new Set([
    normalizeUriForComparison(uri),
    normalizeUriForComparison(resolvedUri),
  ])
  const idCandidates = new Set([
    ...extractExternalUriTrackIds(uri),
    ...extractExternalUriTrackIds(resolvedUri),
  ])

  const cachedTrack = getTracksState().find((track) => {
    if (!track.id || !track.uri || track.isDeleted || track.isExternal) {
      return false
    }

    return (
      idCandidates.has(track.id) ||
      uriCandidates.has(normalizeUriForComparison(track.uri))
    )
  })

  if (cachedTrack) {
    return cachedTrack
  }

  const candidateIds = Array.from(idCandidates).filter(Boolean)
  const candidateUris = Array.from(
    new Set([uri, resolvedUri, ...uriCandidates].filter(Boolean))
  )
  const conditions: SQL[] = []
  if (candidateIds.length > 0) {
    conditions.push(inArray(tracksTable.id, candidateIds))
  }
  if (candidateUris.length > 0) {
    conditions.push(inArray(tracksTable.uri, candidateUris))
  }

  if (conditions.length === 0) {
    return undefined
  }

  const trackMatchCondition =
    conditions.length === 1 ? conditions[0]! : or(...conditions)

  const track = await db.query.tracks.findFirst({
    where: and(eq(tracksTable.isDeleted, 0), trackMatchCondition),
    with: {
      artist: true,
      album: {
        with: {
          artist: true,
        },
      },
      featuredArtists: {
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

  return track ? transformDBTrackToTrack(track) : undefined
}

function buildPlaybackQueue(tracks: Track[], selectedTrackId: string) {
  const selectedTrackIndex = tracks.findIndex(
    (track) => track.id === selectedTrackId
  )
  const currentTrackIndex = selectedTrackIndex >= 0 ? selectedTrackIndex : 0
  const queue = tracks
    .slice(currentTrackIndex)
    .concat(tracks.slice(0, currentTrackIndex))

  return {
    queue,
    queueTrackIds: queue.map((track) => track.id),
  }
}

function allTracksShareValue(
  tracks: Track[],
  getValue: (track: Track) => string | undefined
) {
  const values = tracks
    .map((track) => getValue(track)?.trim())
    .filter((value): value is string => Boolean(value))

  if (values.length !== tracks.length || values.length === 0) {
    return false
  }

  const firstValue = values[0]
  if (!firstValue) {
    return false
  }

  return values.every(
    (value) => value.toLowerCase() === firstValue.toLowerCase()
  )
}

function inferQueueContext(
  track: Track,
  tracks: Track[],
  providedContext?: PlayerQueueContext
): PlayerQueueContext | null {
  const providedTitle = providedContext?.title.trim()
  if (providedContext && providedTitle) {
    return { ...providedContext, title: providedTitle }
  }

  if (track.isExternal) {
    return { type: "external", title: track.title }
  }

  if (
    track.album?.trim() &&
    (allTracksShareValue(tracks, (item) => item.albumId) ||
      allTracksShareValue(tracks, (item) => item.album))
  ) {
    return { type: "album", title: track.album.trim() }
  }

  if (
    track.artist?.trim() &&
    (allTracksShareValue(tracks, (item) => item.artistId) ||
      allTracksShareValue(tracks, (item) => item.artist))
  ) {
    return { type: "artist", title: track.artist.trim() }
  }

  return null
}

export async function setupPlayer() {
  try {
    if (isPlayerReady) {
      return
    }

    logInfo("Setting up audio-browser playback core")
    await setupPlaybackCore()

    const { restoreLastPosition } = preferenceStore.getState()
    const { activeKey } = playbackStore.getState()
    if (restoreLastPosition) {
      playbackStore.setState({
        _hasRestoredPosition: false,
        _restoredTrackKey: activeKey,
      })
    } else {
      playbackStore.setState({
        _hasRestoredPosition: true,
        _restoredTrackKey: undefined,
        lastPosition: 0,
      })
    }

    isPlayerReady = true
    logInfo("Playback core setup completed")
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("already been initialized")
    ) {
      isPlayerReady = true
      logInfo("AudioBrowser playback core already initialized")
      return
    }

    logError("AudioBrowser playback core setup failed", error)
  }
}

export async function playTrack(
  track: Track,
  playlistTracks?: Track[],
  queueContext?: PlayerQueueContext
) {
  if (!isPlayerReady) {
    logWarn("Ignored playTrack call because player is not ready", {
      trackId: track.id,
    })
    return false
  }

  beginPlayerQueueReplacement()

  try {
    logInfo("Playing track", {
      trackId: track.id,
      queueLength: playlistTracks?.length ?? getTracksState().length,
    })

    const wasShuffled = track.isExternal ? false : getIsShuffledState()
    const tracks = playlistTracks || getTracksState()
    const resolvedQueueContext = inferQueueContext(track, tracks, queueContext)
    const { queue: linearQueue } = buildPlaybackQueue(tracks, track.id)

    await resetCrossfadeVolume()
    const started = await playFromTracks({
      track,
      tracks: linearQueue,
      context: resolvedQueueContext,
      shuffle: wasShuffled,
    })
    if (!started) {
      return false
    }
    if (!track.isExternal) {
      await handleTrackActivated(track)
      await persistPlaybackSession({ force: true })
    }
    return true
  } catch (error) {
    logError("Failed to play track", error, { trackId: track.id })
    return false
  } finally {
    endPlayerQueueReplacement()
  }
}

export async function playExternalFileUri(uri: string) {
  const externalUri = normalizeExternalIntentUri(uri)
  if (!externalUri) {
    return false
  }

  if (!isPlayerReady) {
    await setupPlayer()
  }

  if (!isPlayerReady) {
    logWarn("Ignored external file playback because player is not ready", {
      uri: externalUri,
    })
    return false
  }

  const resolvedUri = await resolvePlayableFileUri(externalUri)
  const indexedTrack = await findIndexedTrackForExternalUri(
    externalUri,
    resolvedUri
  )

  if (indexedTrack) {
    logInfo("Playing indexed track matched from external file intent", {
      trackId: indexedTrack.id,
    })
    return await playTrack(indexedTrack, [indexedTrack], {
      type: "external",
      title: indexedTrack.title,
    })
  }

  try {
    const indexedExternalTrack = await indexExternalFileTrack(
      externalUri,
      resolvedUri
    )
    const currentTracks = getTracksState()
    if (!currentTracks.some((track) => track.id === indexedExternalTrack.id)) {
      setTracksState([...currentTracks, indexedExternalTrack])
    }
    logInfo("Playing newly indexed external file", {
      trackId: indexedExternalTrack.id,
    })
    return await playTrack(indexedExternalTrack, [indexedExternalTrack], {
      type: "external",
      title: indexedExternalTrack.title,
    })
  } catch (error) {
    logWarn("Failed to index external file before playback", {
      uri: externalUri,
      error: error instanceof Error ? error.message : String(error),
    })
    const externalTrack = await buildExternalTrack(externalUri, resolvedUri)
    return await playTrack(externalTrack, [externalTrack], {
      type: "external",
      title: externalTrack.title,
    })
  }
}
