import { logError, logInfo } from "@/modules/logging/service"
import {
  getLastFmSessionKey,
  getLastFmScrobbleConfig,
  LASTFM_SERVICE_URL,
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
    const [sessionKey, scrobbleConfig] = await Promise.all([
      getLastFmSessionKey(),
      getLastFmScrobbleConfig(),
    ])

    if (!sessionKey || !scrobbleConfig.isEnabled) {
      return
    }

    const duration = track.duration || 0
    if (duration < scrobbleConfig.minimumTrackDurationSeconds) {
      logInfo(`Last.fm: Track ${track.name} ignored (shorter than minimum duration: ${duration}s < ${scrobbleConfig.minimumTrackDurationSeconds}s)`)
      return
    }

    const delayPercent = scrobbleConfig.scrobbleDelayPercent
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
    const scrobbleConfig = await getLastFmScrobbleConfig()
    const delayPercent = scrobbleConfig.scrobbleDelayPercent
    current.scrobbleThresholdSeconds = Math.round((duration * delayPercent) / 100)
  }

  if (position >= current.scrobbleThresholdSeconds) {
    await sendScrobble()
  }
}

async function sendNowPlaying() {
  if (!current || current.nowPlayingSent) return
  current.nowPlayingSent = true

  const { artist, title, album, duration, sessionKey } = current

  try {
    const payload = {
      sessionKey,
      artist,
      track: title,
      ...(album ? { album } : {}),
      ...(duration > 0 ? { duration } : {}),
    }

    const response = await fetch(`${LASTFM_SERVICE_URL}/api/lastfm/now-playing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

  const { artist, title, album, startedAt, sessionKey } = current

  try {
    const payload = {
      sessionKey,
      artist,
      track: title,
      timestamp: startedAt,
      ...(album ? { album } : {}),
    }

    const response = await fetch(`${LASTFM_SERVICE_URL}/api/lastfm/scrobble`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
