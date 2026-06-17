import type { Track } from "@/data/track/types"
import type { Artist } from "@/data/artist/types"
import type { PopStrategy } from "./types"

export interface SessionStore {
  playbackSpeed: number
  playbackPitch: number
  displayedTrack: Track | null
  displayedArtists: { artists: Artist[]; popStrategy?: PopStrategy } | null
  activeWaveformContext: unknown | null
}
