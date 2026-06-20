/**
 * Purpose: Provides a TrackPlayer-compatible facade backed by react-native-audio-browser.
 * Caller: Player services, queue controls, session restore, and playback event wiring.
 * Dependencies: react-native-audio-browser.
 * Main Functions: TrackPlayer facade, playback enums, event/capability constants.
 * Side Effects: Controls native audio playback and stores an in-memory queue mirror.
 */

import AudioBrowser from "react-native-audio-browser"

import { getAudioBrowserOptions } from "@/lib/react-native-audio-browser"
import { preferenceStore } from "@/stores/preference/store"

export const AndroidAudioContentType = {
  Music: "music",
} as const

export const Capability = {
  Play: "play",
  Pause: "pause",
  SkipToNext: "skipToNext",
  SkipToPrevious: "skipToPrevious",
  SeekTo: "seekTo",
} as const

export const Event = {
  RemotePlay: "remote-play",
  RemotePause: "remote-pause",
  RemoteNext: "remote-next",
  RemotePrevious: "remote-previous",
  RemoteSeek: "remote-seek",
  RemoteDuck: "remote-duck",
  ServiceKilled: "service-killed",
  PlaybackError: "playback-error",
  PlaybackState: "playback-state",
  PlaybackQueueEnded: "playback-queue-ended",
  PlaybackActiveTrackChanged: "playback-active-track-changed",
  PlaybackProgressUpdated: "playback-progress-updated",
} as const

export const IOSCategory = {
  Playback: "playback",
} as const

export const RepeatMode = {
  Off: "off",
  Track: "track",
  Queue: "queue",
} as const

export const State = {
  None: "none",
  Ready: "ready",
  Playing: "playing",
  Paused: "paused",
  Stopped: "stopped",
  Ended: "ended",
  Error: "error",
  Buffering: "buffering",
  Loading: "loading",
} as const

type ValueOf<T> = T[keyof T]

export type RepeatMode = ValueOf<typeof RepeatMode>
export type State = ValueOf<typeof State>

interface TrackPlayerInput {
  id?: string | number
  url?: string
  title?: string
  artist?: string
  album?: string
  artwork?: string
  duration?: number
}

interface SubscriptionLike {
  remove?: () => void
}

type Listener = (event: Record<string, unknown>) => void

let queueMirror: TrackPlayerInput[] = []
let activeIndexMirror = 0
let repeatModeMirror: RepeatMode = RepeatMode.Off
let volumeMirror = 1

function updateAudioBrowserOptionsFromPreferences() {
  AudioBrowser.updateOptions(
    getAudioBrowserOptions({
      continuePlaybackOnDismiss: preferenceStore.getState().continuePlaybackOnDismiss,
    })
  )
}

function mapInputToAudioBrowserTrack(track: TrackPlayerInput) {
  return {
    src: track.url ?? "",
    title: track.title ?? "",
    artist: track.artist,
    album: track.album,
    artwork: track.artwork,
    duration: track.duration,
  }
}

function mapAudioBrowserState(state?: string): State {
  switch (state) {
    case "playing":
      return State.Playing
    case "paused":
      return State.Paused
    case "stopped":
      return State.Stopped
    case "buffering":
      return State.Buffering
    case "loading":
      return State.Loading
    case "error":
      return State.Error
    case "ended":
      return State.Ended
    case "none":
      return State.None
    default:
      return State.Ready
  }
}

function notifyActiveTrackChanged(index: number) {
  const track = queueMirror[index]
  activeIndexMirror = index
  return {
    index,
    track: track || null,
  }
}

async function loadActiveTrack() {
  const activeTrack = queueMirror[activeIndexMirror]
  if (!activeTrack?.url) {
    return
  }

  await AudioBrowser.load(mapInputToAudioBrowserTrack(activeTrack))
}

function addAudioBrowserListener(
  source: { addListener?: (listener: (event: unknown) => void) => (() => void) | SubscriptionLike },
  listener: Listener,
  mapEvent: (event: unknown) => Record<string, unknown>
) {
  const subscription = source.addListener?.((event) => listener(mapEvent(event)))
  if (typeof subscription === "function") {
    return { remove: subscription }
  }

  return subscription ?? { remove: () => undefined }
}

function readEventNumber(event: unknown, key: string) {
  if (!event || typeof event !== "object") {
    return undefined
  }

  const value = (event as Record<string, unknown>)[key]
  return typeof value === "number" ? value : undefined
}

function readEventString(event: unknown, key: string) {
  if (!event || typeof event !== "object") {
    return undefined
  }

  const value = (event as Record<string, unknown>)[key]
  return typeof value === "string" ? value : undefined
}

export const TrackPlayer = {
  async setupPlayer() {
    await AudioBrowser.setupPlayer({})
    updateAudioBrowserOptionsFromPreferences()
  },

  async updateOptions() {
    updateAudioBrowserOptionsFromPreferences()
  },

  async add(tracks: TrackPlayerInput[] | TrackPlayerInput, insertBeforeIndex?: number) {
    const nextTracks = Array.isArray(tracks) ? tracks : [tracks]
    if (
      typeof insertBeforeIndex === "number" &&
      insertBeforeIndex >= 0 &&
      insertBeforeIndex <= queueMirror.length
    ) {
      queueMirror = [
        ...queueMirror.slice(0, insertBeforeIndex),
        ...nextTracks,
        ...queueMirror.slice(insertBeforeIndex),
      ]
    } else {
      queueMirror = [...queueMirror, ...nextTracks]
    }
    if (queueMirror.length === nextTracks.length) {
      activeIndexMirror = 0
      await loadActiveTrack()
    }
  },

  async remove(indexes: number[] | number) {
    const indexesToRemove = new Set(Array.isArray(indexes) ? indexes : [indexes])
    queueMirror = queueMirror.filter((_, index) => !indexesToRemove.has(index))
    if (activeIndexMirror >= queueMirror.length) {
      activeIndexMirror = Math.max(0, queueMirror.length - 1)
    }
    await loadActiveTrack()
  },

  async move(fromIndex: number, toIndex: number) {
    const [track] = queueMirror.splice(fromIndex, 1)
    if (!track) {
      return
    }
    queueMirror.splice(toIndex, 0, track)
    if (activeIndexMirror === fromIndex) {
      activeIndexMirror = toIndex
    }
  },

  async reset() {
    queueMirror = []
    activeIndexMirror = 0
    AudioBrowser.reset()
  },

  async play() {
    if (queueMirror.length > 0) {
      await loadActiveTrack()
    }
    AudioBrowser.play()
  },

  async pause() {
    AudioBrowser.pause()
  },

  async skip(index: number) {
    if (index < 0 || index >= queueMirror.length) {
      return
    }

    activeIndexMirror = index
    await loadActiveTrack()
  },

  async skipToNext() {
    const nextIndex = activeIndexMirror + 1
    if (nextIndex < queueMirror.length) {
      await this.skip(nextIndex)
    }
  },

  async skipToPrevious() {
    const previousIndex = activeIndexMirror - 1
    if (previousIndex >= 0) {
      await this.skip(previousIndex)
    }
  },

  async seekTo(position: number) {
    AudioBrowser.seekTo(position)
  },

  async getPosition() {
    return AudioBrowser.getProgress().position ?? 0
  },

  async getDuration() {
    return AudioBrowser.getProgress().duration ?? queueMirror[activeIndexMirror]?.duration ?? 0
  },

  async getState() {
    return mapAudioBrowserState(AudioBrowser.getPlayback().state)
  },

  async getQueue() {
    return queueMirror
  },

  async getCurrentTrack() {
    return queueMirror.length > 0 ? activeIndexMirror : null
  },

  async getActiveTrack() {
    return queueMirror[activeIndexMirror] ?? null
  },

  async setRepeatMode(mode: RepeatMode) {
    repeatModeMirror = mode
    AudioBrowser.setRepeatMode(
      mode === RepeatMode.Track ? "track" : mode === RepeatMode.Queue ? "queue" : "off"
    )
  },

  async getRepeatMode() {
    return repeatModeMirror
  },

  async setVolume(volume: number) {
    volumeMirror = volume
    AudioBrowser.setVolume(volume)
  },

  async getVolume() {
    return volumeMirror
  },

  addEventListener(event: ValueOf<typeof Event>, listener: Listener) {
    switch (event) {
      case Event.RemotePlay:
        AudioBrowser.handleRemotePlay(() => listener({}))
        return { remove: () => undefined }
      case Event.RemotePause:
        AudioBrowser.handleRemotePause(() => listener({}))
        return { remove: () => undefined }
      case Event.RemoteNext:
        AudioBrowser.handleRemoteNext(() => listener({}))
        return { remove: () => undefined }
      case Event.RemotePrevious:
        AudioBrowser.handleRemotePrevious(() => listener({}))
        return { remove: () => undefined }
      case Event.RemoteSeek:
        AudioBrowser.handleRemoteSeek((event) =>
          listener(event as unknown as Record<string, unknown>)
        )
        return { remove: () => undefined }
      case Event.PlaybackState:
        return addAudioBrowserListener(AudioBrowser.onPlaybackChanged, listener, (event) => ({
          state: mapAudioBrowserState(readEventString(event, "state")),
        }))
      case Event.PlaybackProgressUpdated:
        return addAudioBrowserListener(AudioBrowser.onProgressUpdated, listener, (event) => ({
          position: readEventNumber(event, "position") ?? 0,
          duration: readEventNumber(event, "duration") ?? 0,
        }))
      case Event.PlaybackActiveTrackChanged:
        return addAudioBrowserListener(AudioBrowser.onActiveTrackChanged, listener, (event) => {
          const index = readEventNumber(event, "index") ?? activeIndexMirror
          return notifyActiveTrackChanged(index)
        })
      case Event.PlaybackQueueEnded:
        return addAudioBrowserListener(AudioBrowser.onQueueEnded, listener, () => ({}))
      case Event.PlaybackError:
        return addAudioBrowserListener(
          AudioBrowser.onPlaybackError,
          listener,
          (event) => event as Record<string, unknown>
        )
      case Event.ServiceKilled:
        AudioBrowser.handleBeforeServiceKilled(() => listener({}))
        return { remove: () => undefined }
      case Event.RemoteDuck:
      default:
        return { remove: () => undefined }
    }
  },
}
