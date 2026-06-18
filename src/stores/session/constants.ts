import type { Track } from "@/modules/tracks/types"
import type { Artist } from "@/modules/library/data-types"
import type { PopStrategy } from "./types"

export interface SessionStore {
  playbackSpeed: number
  playbackPitch: number
  displayedTrack: Track | null
  displayedArtists: { artists: Artist[]; popStrategy?: PopStrategy } | null
  activeWaveformContext: unknown | null
}
