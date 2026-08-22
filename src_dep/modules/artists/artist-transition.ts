interface ResolveArtistTransitionIdParams {
  transitionId?: string | null
  id?: string | null
  name?: string | null
}

interface ResolveAlbumTransitionIdParams {
  transitionId?: string | null
  id?: string | null
  title?: string | null
}

interface ResolvePlaylistTransitionIdParams {
  transitionId?: string | null
  id?: string | null
  title?: string | null
}

export function resolveArtistTransitionId(params: ResolveArtistTransitionIdParams) {
  const candidate = params.transitionId?.trim() || params.id?.trim() || params.name?.trim()

  if (!candidate) {
    return "artist:unknown"
  }

  if (candidate.startsWith("artist:")) {
    return candidate
  }

  return `artist:${candidate}`
}

export function resolveAlbumTransitionId(params: ResolveAlbumTransitionIdParams) {
  const candidate = params.transitionId?.trim() || params.id?.trim() || params.title?.trim()

  if (!candidate) {
    return "album:unknown"
  }

  if (candidate.startsWith("album:")) {
    return candidate
  }

  return `album:${candidate}`
}

export function resolvePlaylistTransitionId(params: ResolvePlaylistTransitionIdParams) {
  const candidate = params.transitionId?.trim() || params.id?.trim() || params.title?.trim()

  if (!candidate) {
    return "playlist:unknown"
  }

  if (candidate.startsWith("playlist:")) {
    return candidate
  }

  return `playlist:${candidate}`
}
