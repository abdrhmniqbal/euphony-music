import * as Crypto from "expo-crypto"
import * as SecureStore from "expo-secure-store"
import { logError } from "@/modules/logging/service"

export interface LastFmScrobbleConfig {
  isEnabled: boolean
  minimumTrackDurationSeconds: number
  scrobbleDelayPercent: number
}

export interface LastFmIntegrationState {
  isConfigured: boolean
  isConnected: boolean
  apiKey?: string
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

export async function getLastFmApiCredentials() {
  const apiKey = process.env.EXPO_PUBLIC_LASTFM_API_KEY
  const apiSecret = process.env.EXPO_PUBLIC_LASTFM_API_SECRET

  return {
    apiKey: apiKey || undefined,
    apiSecret: apiSecret || undefined,
  }
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
  const [sessionKey, username, credentials, scrobbleConfig] = await Promise.all([
    SecureStore.getItemAsync(LASTFM_SESSION_KEY),
    SecureStore.getItemAsync(LASTFM_USERNAME_KEY),
    getLastFmApiCredentials(),
    getLastFmScrobbleConfig(),
  ])

  return {
    isConfigured: Boolean(credentials.apiKey && credentials.apiSecret),
    isConnected: Boolean(sessionKey),
    apiKey: credentials.apiKey,
    username: username || undefined,
    scrobbleConfig,
  }
}

export function createSignature(params: Record<string, string>, apiSecret: string) {
  const input = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("")

  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.MD5, `${input}${apiSecret}`)
}

export async function connectLastFmWithCredentials({
  username,
  password,
}: {
  username: string
  password: string
}): Promise<LastFmIntegrationState> {
  const apiKey = process.env.EXPO_PUBLIC_LASTFM_API_KEY?.trim()
  const apiSecret = process.env.EXPO_PUBLIC_LASTFM_API_SECRET?.trim()

  if (!apiKey || !apiSecret) {
    throw new Error("Last.fm API key and secret are not configured in this app build.")
  }

  const signatureParams: Record<string, string> = {
    api_key: apiKey,
    method: "auth.getMobileSession",
    password,
    username,
  }

  const apiSig = await createSignature(signatureParams, apiSecret)
  const body = new URLSearchParams({ ...signatureParams, api_sig: apiSig, format: "json" })

  const response = await fetch(LASTFM_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "could not read body")
    let lastfmMessage = "Unknown Last.fm error"
    try {
      const parsed = JSON.parse(errorText)
      if (parsed?.message) lastfmMessage = parsed.message
    } catch {
      // ignore
    }

    logError("Last.fm authentication request failed", undefined, {
      status: response.status,
      body: errorText,
      username,
    })
    throw new Error(`Last.fm authentication failed: ${lastfmMessage}`)
  }

  const data = (await response.json()) as LastFmSessionResponse
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
