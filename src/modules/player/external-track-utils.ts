export function decodeUriRecursively(value: string) {
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

export function normalizeExternalIntentUri(uri: string) {
  const decodedUri = decodeUriRecursively(uri).trim()

  if (/^content:\/(?!\/)/i.test(decodedUri)) {
    return decodedUri.replace(/^content:\//i, "content://")
  }

  if (/^file:\/(?!\/)/i.test(decodedUri)) {
    return decodedUri.replace(/^file:\//i, "file:///")
  }

  return decodedUri
}

export function normalizeUriForComparison(uri: string) {
  const decodedUri = decodeUriRecursively(uri).trim()
  const withoutQuery = decodedUri.split(/[?#]/)[0] ?? decodedUri

  return withoutQuery.replace(/\/+$/, "")
}

export function extractExternalUriTrackIds(uri: string) {
  const decodedUri = decodeUriRecursively(uri)
  const candidates = new Set<string>()
  const documentIdMatch = decodedUri.match(/(?:document|tree)\/audio:([^/?#]+)/i)
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

export function getExternalTrackTitle(uri: string) {
  const normalizedUri = decodeUriRecursively(uri)
  const pathWithoutQuery = normalizedUri.split(/[?#]/)[0] ?? normalizedUri
  const filename = pathWithoutQuery.split("/").filter(Boolean).at(-1) ?? ""
  const title = filename.replace(/\.[^.]+$/, "").trim()

  return title || normalizedUri
}

export function getExternalFilename(uri: string) {
  const normalizedUri = decodeUriRecursively(uri)
  const pathWithoutQuery = normalizedUri.split(/[?#]/)[0] ?? normalizedUri
  return pathWithoutQuery.split("/").filter(Boolean).at(-1) ?? normalizedUri
}

export function hashExternalTrackId(uri: string) {
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
