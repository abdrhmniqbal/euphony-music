/**
 * Purpose: Controls playback using reference-style queue state and AudioBrowser.
 * Caller: Player service/control facades and remote playback handlers.
 * Dependencies: AudioBrowser, playback store, AudioBrowser helper, player adapters.
 * Main Functions: setupPlayback(), playFromTracks(), play(), pause(), next(), prev(), seekTo(), playAtIndex().
 * Side Effects: Mutates playback store and native audio playback.
 */

import AudioBrowser from "react-native-audio-browser"

import { getAudioBrowserOptions, isAudioBrowserSetUp } from "@/lib/react-native-audio-browser"
import { handleTrackProgress } from "@/modules/player/player-activity.service"
import { mapTrackToTrackPlayerInput } from "@/modules/player/player-adapter"
import { setActiveTrack, setPlaybackProgress } from "@/modules/player/player-runtime-state"
import type { PlayerQueueContext, RepeatModeType, Track } from "@/modules/player/player.types"
import {
  setImmediateQueueTrackIdsState,
  setIsPlayingState,
  setIsShuffledState,
  setOriginalQueueState,
  setOriginalQueueTrackIdsState,
  setQueueContextState,
  setQueueState,
  setQueueTrackIdsState,
  setTracksState,
} from "@/modules/player/player.store"
import { preferenceStore } from "@/stores/preference/store"
import { playbackStore } from "../store"
import { extractTrackId, getTrackLookup, getUpdatedLists } from "../utils"

function toAudioBrowserTrack(track: Track) {
  const mappedTrack = mapTrackToTrackPlayerInput(track)
  return {
    src: mappedTrack.url,
    title: mappedTrack.title,
    artist: mappedTrack.artist,
    album: mappedTrack.album,
    artwork: mappedTrack.artwork,
    duration: mappedTrack.duration,
  }
}

function toAudioBrowserRepeat(mode: RepeatModeType) {
  return mode === "track" ? "track" : "off"
}

function resolveQueueTracks(queue: string[], trackLookup: Map<string, Track>) {
  const resolvedTracks: Track[] = []
  for (const trackId of queue) {
    const track = trackLookup.get(extractTrackId(trackId))
    if (track) {
      resolvedTracks.push(track)
    }
  }

  return resolvedTracks
}

export async function setupPlayback() {
  const { continuePlaybackOnDismiss, downsamplingProcessor } =
    preferenceStore.getState()
  await AudioBrowser.setupPlayer({
    android: {
      downsamplingProcessor,
    },
  })
  AudioBrowser.updateOptions(getAudioBrowserOptions({ continuePlaybackOnDismiss }))
  AudioBrowser.handleRemotePlay(() => {
    void play()
  })
  AudioBrowser.handleRemotePause(() => {
    void pause()
  })
  AudioBrowser.handleRemoteNext(() => {
    void next()
  })
  AudioBrowser.handleRemotePrevious(() => {
    void prev()
  })
  AudioBrowser.handleRemoteSeek(({ position }) => {
    void seekTo(position)
  })
  AudioBrowser.onPlaybackChanged.addListener((event) => {
    playbackStore.setState({ isPlaying: event.state === "playing" })
  })
  AudioBrowser.onProgressUpdated.addListener((event) => {
    if (event.duration === 0) {
      return
    }
    playbackStore.setState({
      lastPosition: event.position,
      duration: event.duration,
    })
    setPlaybackProgress(event.position, event.duration)
    handleTrackProgress(event.position, event.duration)
  })
  AudioBrowser.onQueueEnded.addListener(() => {
    void next(true)
  })
}

export async function loadCurrentTrack() {
  const { activeTrack } = playbackStore.getState()
  if (!activeTrack) {
    return false
  }

  AudioBrowser.load(toAudioBrowserTrack(activeTrack))
  setActiveTrack(activeTrack)
  setPlaybackProgress(0, activeTrack.duration || 0)
  return true
}

export async function play() {
  playbackStore.setState({ isPlaying: true })
  setIsPlayingState(true)
  if (!(await isAudioBrowserSetUp())) {
    await loadCurrentTrack()
  }
  AudioBrowser.play()
}

export async function pause() {
  playbackStore.setState({ isPlaying: false })
  setIsPlayingState(false)
  AudioBrowser.pause()
}

export async function playToggle() {
  if (playbackStore.getState().isPlaying) {
    await pause()
    return
  }

  await play()
}

export async function playFromTracks(options: {
  track: Track
  tracks: Track[]
  context: PlayerQueueContext | null
  shuffle: boolean
}) {
  const playableTracks = options.tracks.filter(
    (track) => track.id && track.uri && !track.isDeleted
  )
  const trackIds = playableTracks.map((track) => track.id)
  const trackLookup = getTrackLookup(playableTracks)
  const listInfo = getUpdatedLists(trackIds, options.shuffle, options.track.id)
  const activeKey = listInfo.queue[0]
  const activeTrack = activeKey
    ? trackLookup.get(extractTrackId(activeKey))
    : undefined
  if (!activeTrack) {
    return false
  }

  playbackStore.setState({
    isPlaying: true,
    lastPosition: 0,
    duration: activeTrack.duration || 0,
    tracks: playableTracks,
    ...listInfo,
    activeKey,
    activeTrack,
    queueContext: options.context,
  })
  setTracksState(playableTracks)
  setQueueState(resolveQueueTracks(listInfo.queue, trackLookup))
  setQueueTrackIdsState(listInfo.queue.map(extractTrackId))
  setOriginalQueueState(playableTracks)
  setOriginalQueueTrackIdsState(trackIds)
  setImmediateQueueTrackIdsState([])
  setQueueContextState(options.context)
  setIsShuffledState(options.shuffle)
  await loadCurrentTrack()
  AudioBrowser.setRepeatMode(toAudioBrowserRepeat(playbackStore.getState().repeat))
  AudioBrowser.play()
  return true
}

export async function next(naturalProgression = false) {
  const { queue, queuePosition, repeat, getTrack } = playbackStore.getState()
  if (queue.length === 0) {
    return
  }

  const nextPosition = queuePosition === queue.length - 1 ? 0 : queuePosition + 1
  if (nextPosition === 0 && repeat === "off") {
    if (naturalProgression) {
      await pause()
    }
    return
  }

  const activeKey = queue[nextPosition]
  if (!activeKey) {
    await playbackStore.getState().reset()
    return
  }

  const activeTrack = await getTrack(activeKey)
  if (!activeTrack) {
    return
  }

  playbackStore.setState({
    lastPosition: 0,
    activeKey,
    activeTrack,
    queuePosition: nextPosition,
  })
  setActiveTrack(activeTrack)
  await loadCurrentTrack()
  if (playbackStore.getState().isPlaying) {
    AudioBrowser.play()
  }
}

export async function prev() {
  const { lastPosition, queue, queuePosition, getTrack } =
    playbackStore.getState()
  if (lastPosition > 3) {
    await seekTo(0)
    return
  }

  if (queue.length === 0) {
    return
  }

  const previousPosition = queuePosition === 0 ? queue.length - 1 : queuePosition - 1
  const activeKey = queue[previousPosition]
  if (!activeKey) {
    await playbackStore.getState().reset()
    return
  }

  const activeTrack = await getTrack(activeKey)
  if (!activeTrack) {
    return
  }

  playbackStore.setState({
    lastPosition: 0,
    activeKey,
    activeTrack,
    queuePosition: previousPosition,
  })
  setActiveTrack(activeTrack)
  await loadCurrentTrack()
  if (playbackStore.getState().isPlaying) {
    AudioBrowser.play()
  }
}

export async function playAtIndex(index: number) {
  const { queue, getTrack } = playbackStore.getState()
  const activeKey = queue[index]
  if (!activeKey) {
    return
  }

  const activeTrack = await getTrack(activeKey)
  if (!activeTrack) {
    return
  }

  playbackStore.setState({
    isPlaying: true,
    lastPosition: 0,
    activeKey,
    activeTrack,
    queuePosition: index,
  })
  setActiveTrack(activeTrack)
  await loadCurrentTrack()
  AudioBrowser.play()
}

export async function seekTo(position: number) {
  playbackStore.setState({ lastPosition: position })
  setPlaybackProgress(position, playbackStore.getState().duration)
  AudioBrowser.seekTo(position)
}

export function setRepeatMode(mode: RepeatModeType) {
  playbackStore.setState({ repeat: mode })
  AudioBrowser.setRepeatMode(toAudioBrowserRepeat(mode))
}
