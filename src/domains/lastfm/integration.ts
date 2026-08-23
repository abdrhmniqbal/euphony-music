import * as SecureStore from "expo-secure-store"
import { logError } from "@/core/log/service"

export interface LastFmScrobbleConfig {
  isEnabled: boolean
  minimumTrackDurationSeconds: number
  scrobbleDelayPercent: number
}

export interface LastFmIntegrationState {
  isConfigured: boolean
  isConnected: boolean
  username?: string
  scrobbleConfig: LastFmScrobbleConfig
}

interface LastFmSessionResponse {
  session?: {
    name?: string
    key?: string
    subscriber?: number
  }
  error?: number
  message?: string
}

export const LASTFM_SERVICE_URL =
  process.env.EXPO_PUBLIC_LASTFM_SERVICE_URL?.trim() || "https://app-services.startune.web.id"

const LASTFM_SESSION_KEY = "lastfm.sessionKey"
const LASTFM_USERNAME_KEY = "lastfm.username"
const LASTFM_SCROBBLE_ENABLED_KEY = "lastfm.scrobbleEnabled"
const LASTFM_MINIMUM_TRACK_DURATION_KEY = "lastfm.minimumTrackDurationSeconds"
const LASTFM_SCROBBLE_DELAY_PERCENT_KEY = "lastfm.scrobbleDelayPercent"
export const LASTFM_API_URL = "https://ws.audioscrobbler.com/2.0/"

export const DEFAULT_LASTFM_SCROBBLE_CONFIG: LastFmScrobbleConfig = {
  isEnabled: false,
  minimumTrackDurationSeconds: 30,
  scrobbleDelayPercent: 30,
}

function sanitizeScrobbleConfig(source: {
  isEnabled?: string | null
  minimumTrackDurationSeconds?: string | null
  scrobbleDelayPercent?: string | null
}): LastFmScrobbleConfig {
  const minimumTrackDurationSeconds = Number(source.minimumTrackDurationSeconds)
  const scrobbleDelayPercent = Number(source.scrobbleDelayPercent)

  return {
    isEnabled: source.isEnabled === "true",
    minimumTrackDurationSeconds: Number.isFinite(minimumTrackDurationSeconds)
      ? Math.max(1, Math.min(3600, Math.round(minimumTrackDurationSeconds)))
      : DEFAULT_LASTFM_SCROBBLE_CONFIG.minimumTrackDurationSeconds,
    scrobbleDelayPercent: Number.isFinite(scrobbleDelayPercent)
      ? Math.max(15, Math.min(100, Math.round(scrobbleDelayPercent)))
      : DEFAULT_LASTFM_SCROBBLE_CONFIG.scrobbleDelayPercent,
  }
}

export async function getLastFmScrobbleConfig(): Promise<LastFmScrobbleConfig> {
  const [isEnabled, minimumTrackDurationSeconds, scrobbleDelayPercent] = await Promise.all([
    SecureStore.getItemAsync(LASTFM_SCROBBLE_ENABLED_KEY),
    SecureStore.getItemAsync(LASTFM_MINIMUM_TRACK_DURATION_KEY),
    SecureStore.getItemAsync(LASTFM_SCROBBLE_DELAY_PERCENT_KEY),
  ])

  return sanitizeScrobbleConfig({ isEnabled, minimumTrackDurationSeconds, scrobbleDelayPercent })
}

export async function setLastFmScrobbleConfig(
  updates: Partial<LastFmScrobbleConfig>
): Promise<LastFmIntegrationState> {
  const current = await getLastFmScrobbleConfig()
  const next = sanitizeScrobbleConfig({
    isEnabled: String(updates.isEnabled ?? current.isEnabled),
    minimumTrackDurationSeconds: String(
      updates.minimumTrackDurationSeconds ?? current.minimumTrackDurationSeconds
    ),
    scrobbleDelayPercent: String(updates.scrobbleDelayPercent ?? current.scrobbleDelayPercent),
  })

  await Promise.all([
    SecureStore.setItemAsync(LASTFM_SCROBBLE_ENABLED_KEY, String(next.isEnabled)),
    SecureStore.setItemAsync(
      LASTFM_MINIMUM_TRACK_DURATION_KEY,
      String(next.minimumTrackDurationSeconds)
    ),
    SecureStore.setItemAsync(LASTFM_SCROBBLE_DELAY_PERCENT_KEY, String(next.scrobbleDelayPercent)),
  ])

  return getLastFmIntegrationState()
}

export async function getLastFmIntegrationState(): Promise<LastFmIntegrationState> {
  const [sessionKey, username, scrobbleConfig] = await Promise.all([
    SecureStore.getItemAsync(LASTFM_SESSION_KEY),
    SecureStore.getItemAsync(LASTFM_USERNAME_KEY),
    getLastFmScrobbleConfig(),
  ])

  return {
    isConfigured: Boolean(LASTFM_SERVICE_URL),
    isConnected: Boolean(sessionKey),
    username: username || undefined,
    scrobbleConfig,
  }
}

async function callLastFmService<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${LASTFM_SERVICE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "could not read body")
    logError("Last.fm service request failed", undefined, {
      path,
      status: response.status,
      body: errorText,
    })
    throw new Error(errorText || `Last.fm service request failed (${response.status})`)
  }

  return (await response.json()) as T
}

export async function connectLastFmWithCredentials({
  username,
  password,
}: {
  username: string
  password: string
}): Promise<LastFmIntegrationState> {
  const data = await callLastFmService<LastFmSessionResponse>("/api/lastfm/session", {
    username,
    password,
  })
  const sessionKey = data.session?.key
  const returnedUsername = data.session?.name || username

  if (!sessionKey) {
    throw new Error(data.message || "Failed to retrieve Last.fm session")
  }

  await Promise.all([
    SecureStore.setItemAsync(LASTFM_SESSION_KEY, sessionKey),
    SecureStore.setItemAsync(LASTFM_USERNAME_KEY, returnedUsername),
  ])

  return getLastFmIntegrationState()
}

export async function disconnectLastFm(): Promise<LastFmIntegrationState> {
  await Promise.all([
    SecureStore.deleteItemAsync(LASTFM_SESSION_KEY),
    SecureStore.deleteItemAsync(LASTFM_USERNAME_KEY),
  ])

  return getLastFmIntegrationState()
}

export async function forgetLastFmCredentials(): Promise<LastFmIntegrationState> {
  await Promise.all([
    SecureStore.deleteItemAsync(LASTFM_SESSION_KEY),
    SecureStore.deleteItemAsync(LASTFM_USERNAME_KEY),
    SecureStore.deleteItemAsync(LASTFM_SCROBBLE_ENABLED_KEY),
    SecureStore.deleteItemAsync(LASTFM_MINIMUM_TRACK_DURATION_KEY),
    SecureStore.deleteItemAsync(LASTFM_SCROBBLE_DELAY_PERCENT_KEY),
  ])

  return getLastFmIntegrationState()
}

export async function getLastFmSessionKey() {
  return SecureStore.getItemAsync(LASTFM_SESSION_KEY)
}
