/**
 * Purpose: Pure fingerprint matching for track identity reconciliation.
 * Caller: adoption.ts reconcileAdoptions(), unit tests.
 * Dependencies: normalizeText.
 * Main Functions: matchScore(), findBestMatch()
 * Side Effects: None.
 */

import { normalizeText } from "../metadata/normalize"

const DURATION_TOLERANCE_SECONDS = 1

export interface TrackIdentityRow {
  id: string
  title: string | null
  duration: number
  audioBitrate: number | null
  audioSampleRate: number | null
  audioCodec: string | null
  artistName: string | null
  albumTitle: string | null
  playCount: number | null
  lastPlayedAt: number | null
  rating: number | null
  isFavorite: number | null
  favoritedAt: number | null
  dateAdded: number | null
}

function textEquals(a: string | null, b: string | null): boolean {
  const normalizedA = normalizeText(a)?.toLowerCase()
  const normalizedB = normalizeText(b)?.toLowerCase()
  return !!normalizedA && !!normalizedB && normalizedA === normalizedB
}

function compareSignatures(a: TrackIdentityRow, b: TrackIdentityRow) {
  return {
    durationClose: Math.abs((a.duration ?? 0) - (b.duration ?? 0)) <= DURATION_TOLERANCE_SECONDS,
    bitrateEqual:
      a.audioBitrate != null && b.audioBitrate != null && a.audioBitrate === b.audioBitrate,
    sampleRateEqual:
      a.audioSampleRate != null &&
      b.audioSampleRate != null &&
      a.audioSampleRate === b.audioSampleRate,
    codecEqual:
      a.audioCodec != null && b.audioCodec != null
        ? a.audioCodec.toLowerCase() === b.audioCodec.toLowerCase()
        : false,
    titleEqual: textEquals(a.title, b.title),
    artistEqual: textEquals(a.artistName, b.artistName),
  }
}

/**
 * A moved file keeps its audio properties and (usually) its tags, while every
 * MediaStore-derived value changes. Duration agreement is mandatory plus at
 * least two further independent signals; codec alone is too coarse to adopt on
 * (two unrelated tracks of similar length often share a codec).
 */
export function matchScore(a: TrackIdentityRow, b: TrackIdentityRow): number {
  const s = compareSignatures(a, b)
  if (!s.durationClose) return 0
  let score = 0
  if (s.bitrateEqual) score += 1
  if (s.sampleRateEqual) score += 1
  if (s.codecEqual) score += 1
  if (s.titleEqual) score += 2
  if (s.artistEqual) score += 1
  return score >= 2 ? score : 0
}

export function findBestMatch(
  fingerprint: TrackIdentityRow,
  candidates: TrackIdentityRow[]
): TrackIdentityRow | null {
  let best: TrackIdentityRow | null = null
  let bestScore = 0
  for (const candidate of candidates) {
    const score = matchScore(fingerprint, candidate)
    if (score > bestScore || (score > 0 && score === bestScore && best && candidate.id < best.id)) {
      best = candidate
      bestScore = score
    }
  }
  return best
}
