import { logError, logInfo } from "@/modules/logging/service"
import {
  createSignature,
  getLastFmApiCredentials,
  getLastFmSessionKey,
  getLastFmIntegrationState,
  LASTFM_API_URL,
} from "@/modules/settings/lastfm-integration"
import type { Track } from "@/modules/tracks/types"

interface CurrentScrobble {
  trackId: string
  title: string
  artist: string
  album?: string
  duration: number
  startedAt: number // Unix timestamp in seconds
  scrobbleThresholdSeconds: number
  nowPlayingSent: boolean
  scrobbleSent: boolean
  isEnabled: boolean
  apiKey: string
  apiSecret: string
  sessionKey: string
}

let current: CurrentScrobble | null = null

export async function handleTrackChanged(track: Track | undefined) {
  if (current?.trackId === track?.id) {
    return
  }

  current = null
  if (!track || !track.name || !track.artistName) {
    return
  }

  try {
    const state = await getLastFmIntegrationState()
    const sessionKey = await getLastFmSessionKey()
    const credentials = await getLastFmApiCredentials()

    if (!state.isConnected || !state.scrobbleConfig.isEnabled || !credentials.apiKey || !credentials.apiSecret || !sessionKey) {
      return
    }

    const duration = track.duration || 0
    if (duration < state.scrobbleConfig.minimumTrackDurationSeconds) {
      logInfo(`Last.fm: Track ${track.name} ignored (shorter than minimum duration: ${duration}s < ${state.scrobbleConfig.minimumTrackDurationSeconds}s)`)
      return
    }

    const delayPercent = state.scrobbleConfig.scrobbleDelayPercent
    const scrobbleThresholdSeconds = Math.round((duration * delayPercent) / 100)

    current = {
      trackId: track.id,
      title: track.name,
      artist: track.artistName,
      album: track.albumName ?? undefined,
      duration,
      startedAt: Math.floor(Date.now() / 1000),
      scrobbleThresholdSeconds,
      nowPlayingSent: false,
      scrobbleSent: false,
      isEnabled: true,
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
      sessionKey,
    }

    logInfo(`Last.fm: Initialized scrobbler for ${track.name} (threshold: ${scrobbleThresholdSeconds}s)`)

    // Send now playing instantly
    await sendNowPlaying()
  } catch (error) {
    logError("Last.fm: failed to initialize track scrobble", error instanceof Error ? error : new Error(String(error)))
  }
}

export async function handlePlaybackProgress(position: number, duration: number) {
  if (!current || current.scrobbleSent) {
    return
  }

  // Update threshold dynamically if duration was initially 0
  if (current.duration === 0 && duration > 0) {
    current.duration = duration
    const state = await getLastFmIntegrationState()
    const delayPercent = state.scrobbleConfig.scrobbleDelayPercent
    current.scrobbleThresholdSeconds = Math.round((duration * delayPercent) / 100)
  }

  if (position >= current.scrobbleThresholdSeconds) {
    await sendScrobble()
  }
}

async function sendNowPlaying() {
  if (!current || current.nowPlayingSent) return
  current.nowPlayingSent = true

  const { artist, title, album, duration, apiKey, apiSecret, sessionKey } = current

  try {
    const params: Record<string, string> = {
      api_key: apiKey,
      artist,
      method: "track.updateNowPlaying",
      sk: sessionKey,
      track: title,
    }
    if (album) params.album = album
    if (duration > 0) params.duration = String(duration)

    const apiSig = await createSignature(params, apiSecret)
    const body = new URLSearchParams({ ...params, api_sig: apiSig, format: "json" })

    const response = await fetch(LASTFM_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new Error(`HTTP ${response.status}: ${text}`)
    }

    logInfo(`Last.fm: Now playing updated for "${title}"`)
  } catch (error) {
    logError(`Last.fm: Now playing update failed for "${title}"`, error instanceof Error ? error : new Error(String(error)))
  }
}

async function sendScrobble() {
  if (!current || current.scrobbleSent) return
  current.scrobbleSent = true

  const { artist, title, album, startedAt, apiKey, apiSecret, sessionKey } = current

  try {
    const params: Record<string, string> = {
      api_key: apiKey,
      artist,
      method: "track.scrobble",
      sk: sessionKey,
      timestamp: String(startedAt),
      track: title,
    }
    if (album) params.album = album

    const apiSig = await createSignature(params, apiSecret)
    const body = new URLSearchParams({ ...params, api_sig: apiSig, format: "json" })

    const response = await fetch(LASTFM_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new Error(`HTTP ${response.status}: ${text}`)
    }

    logInfo(`Last.fm: Scrobbled "${title}"`)
  } catch (error) {
    logError(`Last.fm: Scrobble failed for "${title}"`, error instanceof Error ? error : new Error(String(error)))
    // Allow retry later in this session if it failed due to network
    current.scrobbleSent = false
  }
}
