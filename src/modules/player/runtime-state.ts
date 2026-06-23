import { updateColorsForImage } from "@/modules/player/colors"
import type { Track } from "@/modules/player/types"

import { setCurrentTrackState, setDurationState } from "./store"

export function setActiveTrack(track: Track | null) {
  setCurrentTrackState(track)
  setDurationState(track?.duration || 0)
  void updateColorsForImage(track?.image)
}
