/**
 * Purpose: Normalizes external Android intents and custom deep links before Expo Router attempts route matching.
 * Caller: Expo Router native intent bridge during app launch and runtime URL events.
 * Main Functions: redirectSystemPath()
 */

const FALLBACK_ROUTE = "/(main)/(home)"
const EXTERNAL_AUDIO_ROUTE = "/player"

const ROUTE_PREFIXES = new Set([
  "",
  "(main)",
  "settings",
  "player",
  "notification",
  "notification.click",
  "album",
  "artist",
  "playlist",
  "genre",
  "search",
])

function decodePathRecursively(value: string) {
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

function isLikelyExternalFileIntent(path: string) {
  const normalizedPath = decodePathRecursively(path).toLowerCase()
  const pathWithoutLeadingSlashes = normalizedPath.replace(/^\/+/, "")

  return (
    pathWithoutLeadingSlashes.startsWith("content://") ||
    pathWithoutLeadingSlashes.startsWith("content:/") ||
    pathWithoutLeadingSlashes.startsWith("file://") ||
    pathWithoutLeadingSlashes.startsWith("file:/") ||
    normalizedPath.startsWith("content://") ||
    normalizedPath.startsWith("content:/") ||
    normalizedPath.startsWith("file://") ||
    normalizedPath.startsWith("file:/") ||
    normalizedPath.includes("com.mixplorer") ||
    normalizedPath.includes("com.android.providers.media.documents") ||
    normalizedPath.includes("content%3a%2f") ||
    normalizedPath.includes("/storage/") ||
    normalizedPath.includes(".mp3") ||
    normalizedPath.includes(".flac") ||
    normalizedPath.includes(".opus") ||
    normalizedPath.includes(".m4a") ||
    normalizedPath.includes(".wav")
  )
}

function normalizeExternalIntentUri(path: string) {
  const decodedPath = decodePathRecursively(path).replace(/^\/+(?=\w+:\/)/, "")
  let parsedUrl: URL | null = null

  try {
    parsedUrl = new URL(decodedPath)
  } catch {
    parsedUrl = null
  }

  if (parsedUrl) {
    const host = parsedUrl.host.toLowerCase()
    if (
      parsedUrl.protocol === "startune-music:" &&
      (host.includes("com.mixplorer") || host.includes("com.android.providers.media.documents"))
    ) {
      return `content://${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
    }
  }

  if (/^content:\/(?!\/)/i.test(decodedPath)) {
    return decodedPath.replace(/^content:\//i, "content://")
  }

  if (/^file:\/(?!\/)/i.test(decodedPath)) {
    return decodedPath.replace(/^file:\//i, "file:///")
  }

  return decodedPath
}

function safeParsePath(path: string) {
  try {
    return new URL(path, "startune-music://app")
  } catch {
    return null
  }
}

function buildExternalAudioRoute(uri: string) {
  return `${EXTERNAL_AUDIO_ROUTE}?externalUri=${encodeURIComponent(
    normalizeExternalIntentUri(uri)
  )}`
}

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (isLikelyExternalFileIntent(path)) {
    return buildExternalAudioRoute(decodePathRecursively(path))
  }

  const parsedUrl = safeParsePath(path)
  if (!parsedUrl) {
    return FALLBACK_ROUTE
  }

  const decodedPathname = decodePathRecursively(parsedUrl.pathname)
  const decodedHost = decodePathRecursively(parsedUrl.host)
  const firstSegment = decodedPathname.replace(/^\/+/, "").split("/")[0] ?? ""

  // SAFETY: the playback media notification deep-links to scheme://notification with an empty path
  if (decodedHost === "notification" && (!decodedPathname || decodedPathname === "/")) {
    return "/notification/click"
  }

  if (ROUTE_PREFIXES.has(firstSegment)) {
    return `${decodedPathname}${parsedUrl.search}${parsedUrl.hash}`
  }

  if (ROUTE_PREFIXES.has(decodedHost)) {
    return `/${decodedHost}${decodedPathname}${parsedUrl.search}${parsedUrl.hash}`
  }

  const reconstructedPath = `${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`

  if (isLikelyExternalFileIntent(reconstructedPath)) {
    return buildExternalAudioRoute(decodePathRecursively(reconstructedPath))
  }

  return `${decodedPathname}${parsedUrl.search}${parsedUrl.hash}`
}
