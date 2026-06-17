interface ResolvePlayerTransitionIdParams {
  transitionId?: string | null
  trackId?: string | null
  title?: string | null
}

export function resolvePlayerTransitionId(params: ResolvePlayerTransitionIdParams) {
  const candidate =
    params.transitionId?.trim() || params.trackId?.trim() || params.title?.trim()

  if (!candidate) {
    return "player:unknown"
  }

  if (candidate.startsWith("player:")) {
    return candidate
  }

  return `player:${candidate}`
}
