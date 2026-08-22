import AudioBrowser from "react-native-audio-browser"
import KvStore from "expo-sqlite/kv-store"
import { useStore } from "zustand"

import { maybeGetTrack } from "@/domains/tracks/repository"
import { createPersistedStore } from "@/lib/zustand"
import { logWarn } from "@/core/log/service"

import type { PlaybackQueueContext, PlayFromSource, RepeatMode } from "./types"

export interface PlaybackStore {
  _hasHydrated: boolean
  _init: (state: PlaybackStore) => Promise<void>
  _hasRestoredPosition: boolean
  _restoredTrackKey: string | undefined

  getTrack: (trackKey: string) => Promise<import("@/domains/tracks/types").DataTrack | undefined>
  reset: () => Promise<void>
  restoreActiveTrack: () => Promise<void>

  isPlaying: boolean
  lastPosition: number

  repeat: RepeatMode
  shuffle: boolean

  playingFrom: PlayFromSource | undefined
  playingFromName: string
  queueContext: PlaybackQueueContext | null

  orderSnapshot: string[]
  queue: string[]

  activeKey: string | undefined
  activeTrack: import("@/domains/tracks/types").DataTrack | undefined
  queuePosition: number
  numQueuedNext: number
}

export const PersistedFields: string[] = [
  "_restoredTrackKey",
  "lastPosition",
  "isPlaying",
  "repeat",
  "shuffle",
  "playingFrom",
  "playingFromName",
  "queueContext",
  "orderSnapshot",
  "queue",
  "activeKey",
  "activeTrack",
  "queuePosition",
] satisfies Array<keyof PlaybackStore>

export function extractTrackId(key: string) {
  return key.split("__")[0]!
}

export function arePlaybackSourceEqual(
  source1: PlayFromSource | undefined,
  source2: PlayFromSource
) {
  if (!source1) return false
  return source1.type === source2.type && source1.id === source2.id
}

export const playbackStore = createPersistedStore<PlaybackStore>(
  (set, get) => ({
    _hasHydrated: false,
    _init: async ({ activeKey }) => {
      // Preserve a hydrated activeTrack; only re-resolve when missing. Re-resolution
      // can fail transiently at startup (DB not ready), so never clobber a good
      // restored track with undefined — that wipes the miniplayer on every launch.
      const hydratedActiveTrack = get().activeTrack
      const activeTrack =
        hydratedActiveTrack ?? (activeKey ? await get().getTrack(activeKey) : undefined)
      set({ _hasHydrated: true, activeTrack })
    },

    getTrack: async (trackKey) => {
      const tId = extractTrackId(trackKey)

      try {
        return (await maybeGetTrack(tId)) ?? undefined
      } catch (error) {
        logWarn("Failed to resolve playback track from database", {
          error,
          trackId: tId,
        })
        return undefined
      }
    },

    restoreActiveTrack: async () => {
      const { activeTrack, activeKey, getTrack: resolveTrack } = get()
      if (activeTrack) return
      if (!activeKey) return
      const resolved = await resolveTrack(activeKey)
      if (resolved) {
        set({ activeTrack: resolved })
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
        queueContext: null,
        orderSnapshot: [],
        queue: [],
        activeKey: undefined,
        activeTrack: undefined,
        queuePosition: 0,
        numQueuedNext: 0,
      })
      AudioBrowser.reset()
    },

    _hasRestoredPosition: false,
    _restoredTrackKey: undefined,

    isPlaying: false,
    lastPosition: 0,

    repeat: "no-repeat",
    shuffle: false,

    playingFrom: undefined,
    playingFromName: "",
    queueContext: null,

    orderSnapshot: [],
    queue: [],

    activeKey: undefined,
    activeTrack: undefined,
    queuePosition: 0,
    numQueuedNext: 0,
  }),
  {
    name: "startune::playback-store",
    partialize: (state) =>
      Object.fromEntries(Object.entries(state).filter(([key]) => PersistedFields.includes(key))),
    onRehydrateStorage: () => {
      return (state, error) => {
        if (error) logWarn("Failed to rehydrate playback store", error)
        else void state?._init(state)
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

  const partializedState =
    options.partialize?.(playbackStore.getState()) ?? playbackStore.getState()
  const payload = JSON.stringify({ state: partializedState, version: 0 })

  playbackStoreFlushPromise = playbackStoreFlushPromise.then(() =>
    KvStore.setItem(options.name!, payload)
  )
  return playbackStoreFlushPromise
}

export function setPlaybackLastPosition(position: number): void {
  playbackStore.setState({ lastPosition: position })
  void flushPlaybackStoreSnapshot()
}

export function usePlaybackStore<T>(selector: (s: PlaybackStore) => T): T {
  return useStore(playbackStore, selector)
}
