import { inArray } from "drizzle-orm"
import AudioBrowser from "react-native-audio-browser"
import { useStore } from "zustand"

import { db } from "@/db"
import { playlistTracks } from "@/db/schema"
import { getTrack } from "@/data/track/api"

import { createPersistedStore } from "@/lib/zustand"
import { resetWidgets } from "@/modules/widget/utils"

import type { PlaybackStore } from "./constants"
import { PersistedFields, RepeatModes } from "./constants"
import { extractTrackId } from "./utils"

export const playbackStore = createPersistedStore<PlaybackStore>(
  (set, get) => ({
    _hasHydrated: false,
    _init: async ({ activeKey }) => {
      let activeTrack: PlaybackStore["activeTrack"]
      if (activeKey) {
        activeTrack = await get().getTrack(activeKey)
        if (!activeTrack) return
      }
      let upToDateIsPlaying = false
      try {
        upToDateIsPlaying = AudioBrowser.getPlayingState().playing
      } catch {}
      set({ _hasHydrated: true, isPlaying: upToDateIsPlaying, activeTrack })
    },

    getTrack: async (trackKey) => {
      const tId = extractTrackId(trackKey)
      try {
        const wantedTrack = await getTrack(tId)
        return wantedTrack
      } catch {
        console.log(
          `[Database Mismatch] Track (${tId}) doesn't exist in the database.`,
        )
        await get().reset()
      }
    },
    reset: async () => {
      set({
        _hasHydrated: true,
        _hasRestoredPosition: false,
        _restoredTrackKey: undefined,
        isPlaying: false,
        lastPosition: 0,
        playingFrom: undefined,
        playingFromName: "",
        orderSnapshot: [],
        queue: [],
        activeKey: undefined,
        activeTrack: undefined,
        queuePosition: 0,
        numQueuedNext: 0,
      })
      AudioBrowser.reset()
      await resetWidgets()
    },
    resetOnCrash: async () => {
      try {
        await get().reset()

        const [allTracks, trackRels] = await Promise.all([
          db.query.tracks.findMany({ columns: { id: true } }),
          db
            .selectDistinct({ id: playlistTracks.trackId })
            .from(playlistTracks),
        ])
        const trackIds = new Set(allTracks.map((t) => t.id))
        const relTrackIds = trackRels.map((t) => t.id)
        const invalidTracks = relTrackIds.filter((id) => !trackIds.has(id))
        if (invalidTracks.length > 0) {
          await db
            .delete(playlistTracks)
            .where(inArray(playlistTracks.trackId, invalidTracks))
        }
      } catch {}
    },

    _hasRestoredPosition: false,
    _restoredTrackKey: undefined,

    isPlaying: false,
    lastPosition: 0,

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

    isReplayGainEnabled: false,
    preAmpWTags: 0,
    preAmpWOTags: 0,

    restoreVolume: false,
    volume: 1,
  }),
  {
    name: "music::playback-store",
    partialize: (state) =>
      Object.fromEntries(
        Object.entries(state).filter(([key]) => PersistedFields.includes(key)),
      ),
    onRehydrateStorage: () => {
      return (state, error) => {
        if (error) console.log("[Playback Store]", error)
        else state?._init(state)
      }
    },
  },
)

export function usePlaybackStore<T>(selector: (s: PlaybackStore) => T): T {
  return useStore(playbackStore, selector)
}
