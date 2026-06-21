import * as Crypto from "expo-crypto"
import * as Linking from "expo-linking"
import * as SecureStore from "expo-secure-store"

export interface LastFmIntegrationState {
  isConfigured: boolean
  isConnected: boolean
  pendingToken?: string
  username?: string
}

interface LastFmTokenResponse {
  token?: string
  error?: number
  message?: string
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
const LASTFM_PENDING_TOKEN_KEY = "lastfm.pendingToken"

const LASTFM_API_KEY = process.env.EXPO_PUBLIC_LASTFM_API_KEY
const LASTFM_API_SECRET = process.env.EXPO_PUBLIC_LASTFM_API_SECRET
const LASTFM_AUTH_URL = "https://www.last.fm/api/auth/"
const LASTFM_API_URL = "https://ws.audioscrobbler.com/2.0/"

export function isLastFmConfigured() {
  return Boolean(LASTFM_API_KEY && LASTFM_API_SECRET)
}

export async function getLastFmIntegrationState(): Promise<LastFmIntegrationState> {
  const [sessionKey, username, pendingToken] = await Promise.all([
    SecureStore.getItemAsync(LASTFM_SESSION_KEY),
    SecureStore.getItemAsync(LASTFM_USERNAME_KEY),
    SecureStore.getItemAsync(LASTFM_PENDING_TOKEN_KEY),
  ])

  return {
    isConfigured: isLastFmConfigured(),
    isConnected: Boolean(sessionKey),
    pendingToken: pendingToken || undefined,
    username: username || undefined,
  }
}

function createSignature(params: Record<string, string>) {
  const input = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("")

  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.MD5, `${input}${LASTFM_API_SECRET}`)
}

async function callLastFmApi<T>(params: Record<string, string>) {
  const apiSig = await createSignature(params)
  const body = new URLSearchParams({ ...params, api_sig: apiSig, format: "json" })
  const response = await fetch(LASTFM_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })

  if (!response.ok) {
    throw new Error("Last.fm request failed")
  }

  return (await response.json()) as T
}

export async function openLastFmAuth(): Promise<LastFmIntegrationState> {
  if (!LASTFM_API_KEY || !LASTFM_API_SECRET) {
    return getLastFmIntegrationState()
  }

  const tokenResponse = await callLastFmApi<LastFmTokenResponse>({
    api_key: LASTFM_API_KEY,
    method: "auth.getToken",
  })
  const token = tokenResponse.token

  if (!token) {
    throw new Error(tokenResponse.message || "Last.fm auth token missing")
  }

  await SecureStore.setItemAsync(LASTFM_PENDING_TOKEN_KEY, token)
  await Linking.openURL(
    `${LASTFM_AUTH_URL}?api_key=${encodeURIComponent(LASTFM_API_KEY)}&token=${encodeURIComponent(token)}`
  )

  return getLastFmIntegrationState()
}

export async function completeLastFmAuth(): Promise<LastFmIntegrationState> {
  if (!LASTFM_API_KEY || !LASTFM_API_SECRET) {
    return getLastFmIntegrationState()
  }

  const token = await SecureStore.getItemAsync(LASTFM_PENDING_TOKEN_KEY)
  if (!token) {
    throw new Error("Last.fm auth token missing")
  }

  const data = await callLastFmApi<LastFmSessionResponse>({
    api_key: LASTFM_API_KEY,
    method: "auth.getSession",
    token,
  })
  const sessionKey = data.session?.key
  const username = data.session?.name

  if (!sessionKey) {
    throw new Error(data.message || "Last.fm session key missing")
  }

  await Promise.all([
    SecureStore.setItemAsync(LASTFM_SESSION_KEY, sessionKey),
    username
      ? SecureStore.setItemAsync(LASTFM_USERNAME_KEY, username)
      : SecureStore.deleteItemAsync(LASTFM_USERNAME_KEY),
    SecureStore.deleteItemAsync(LASTFM_PENDING_TOKEN_KEY),
  ])

  return getLastFmIntegrationState()
}

export async function disconnectLastFm(): Promise<LastFmIntegrationState> {
  await Promise.all([
    SecureStore.deleteItemAsync(LASTFM_SESSION_KEY),
    SecureStore.deleteItemAsync(LASTFM_USERNAME_KEY),
    SecureStore.deleteItemAsync(LASTFM_PENDING_TOKEN_KEY),
  ])

  return getLastFmIntegrationState()
}

export async function getLastFmSessionKey() {
  return SecureStore.getItemAsync(LASTFM_SESSION_KEY)
}
