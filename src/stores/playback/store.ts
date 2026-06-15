/**
 * Purpose: Stores reference-style playback state keyed by queue track ids.
 * Caller: Playback actions and old player-store facade.
 * Dependencies: Zustand, AudioBrowser, player types.
 * Main Functions: playbackStore, usePlaybackStore.
 * Side Effects: Resets native playback when reset() runs.
 */

import AudioBrowser from "react-native-audio-browser"
import { create } from "zustand"

import type { Track } from "@/modules/player/player.types"
import type { PlaybackStore } from "./constants"
import { RepeatModes } from "./constants"
import { extractTrackId } from "./utils"

export const usePlaybackStore = create<PlaybackStore>((set, get) => ({
  _hasHydrated: true,
  isPlaying: false,
  lastPosition: 0,
  duration: 0,
  repeat: RepeatModes.NO_REPEAT,
  shuffle: false,
  playingFrom: undefined,
  playingFromName: "",
  orderSnapshot: [],
  queue: [],
  activeKey: undefined,
  activeTrack: undefined,
  queuePosition: 0,
  numQueuedNext: 0,
  queueContext: null,
  tracks: [],
  reset: async () => {
    set({
      isPlaying: false,
      lastPosition: 0,
      duration: 0,
      playingFrom: undefined,
      playingFromName: "",
      orderSnapshot: [],
      queue: [],
      activeKey: undefined,
      activeTrack: undefined,
      queuePosition: 0,
      numQueuedNext: 0,
      queueContext: null,
    })
    AudioBrowser.reset()
  },
  getTrack: async (trackKey: string) => {
    const trackId = extractTrackId(trackKey)
    const track = get().tracks.find((item) => item.id === trackId)
    if (!track) {
      await get().reset()
      return undefined
    }

    return track
  },
}))

export const playbackStore = usePlaybackStore

export function setPlaybackTracks(tracks: Track[]) {
  usePlaybackStore.setState({ tracks })
}
