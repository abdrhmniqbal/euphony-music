import { inArray } from "drizzle-orm"
import AudioBrowser from "react-native-audio-browser"
import KvStore from "expo-sqlite/kv-store"
import { useStore } from "zustand"

import { db } from "@/db"
import { playlistTracks } from "@/db/schema"
import { maybeGetTrack } from "@/modules/tracks/repository"

import { createPersistedStore } from "@/lib/zustand"
import { resetWidgets } from "@/modules/widget/utils"

import { logWarn } from "@/modules/logging/service"
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
      }
      let upToDateIsPlaying = false
      try {
        upToDateIsPlaying = AudioBrowser.getPlayingState().playing
      } catch {
        // Intentionally silent: AudioBrowser might not be initialized yet during early hydration.
      }
      set({ _hasHydrated: true, isPlaying: upToDateIsPlaying, activeTrack })
    },

    getTrack: async (trackKey) => {
      const tId = extractTrackId(trackKey)

      try {
        const wantedTrack = await maybeGetTrack(tId)
        if (wantedTrack) {
          return wantedTrack
        }

        console.log(`[Database Mismatch] Track (${tId}) doesn't exist in the database.`)
        await get().reset()
      } catch (error) {
        logWarn("Failed to resolve playback track from database", {
          error,
          trackId: tId,
        })
      }
    },
    restoreActiveTrack: async () => {
      const { activeTrack, activeKey, getTrack: resolveTrack } = get()
      if (!activeTrack && activeKey) {
        const resolved = await resolveTrack(activeKey)
        if (resolved) {
          set({ activeTrack: resolved })
        }
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
          db.selectDistinct({ id: playlistTracks.trackId }).from(playlistTracks),
        ])
        const trackIds = new Set(allTracks.map((t) => t.id))
        const relTrackIds = trackRels.map((t) => t.id)
        const invalidTracks = relTrackIds.filter((id) => !trackIds.has(id))
        if (invalidTracks.length > 0) {
          await db.delete(playlistTracks).where(inArray(playlistTracks.trackId, invalidTracks))
        }
      } catch (error) {
        logWarn("Failed to reset queue database relationships on crash", error)
      }
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
      Object.fromEntries(Object.entries(state).filter(([key]) => PersistedFields.includes(key))),
    onRehydrateStorage: () => {
      return (state, error) => {
        if (error) logWarn("Failed to rehydrate playback store", error)
        else state?._init(state)
      }
    },
  }
)

let playbackStoreFlushPromise = Promise.resolve()

export function flushPlaybackStoreSnapshot(): Promise<void> {
  const options = playbackStore.persist.getOptions()
  if (!options.name) {
    return Promise.resolve()
  }

  const partializedState = options.partialize?.(playbackStore.getState()) ?? playbackStore.getState()
  const payload = JSON.stringify({ state: partializedState, version: options.version })

  playbackStoreFlushPromise = playbackStoreFlushPromise.then(() => KvStore.setItem(options.name!, payload))
  return playbackStoreFlushPromise
}

export function setPlaybackLastPosition(position: number): void {
  playbackStore.setState({ lastPosition: position })
  void flushPlaybackStoreSnapshot()
}

export function usePlaybackStore<T>(selector: (s: PlaybackStore) => T): T {
  return useStore(playbackStore, selector)
}
