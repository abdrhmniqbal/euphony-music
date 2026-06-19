import AudioBrowser from "react-native-audio-browser"

import type { PlayerQueueContext, RepeatModeType, Track } from "@/modules/player/types"
import { PlaybackControls, PlaybackSettings, Queue } from "@/stores/playback/actions"
import { playbackStore } from "@/stores/playback/store"
import { getUpdatedLists } from "@/stores/playback/utils"

import { getAudioBrowserOptions } from "@/lib/react-native-audio-browser"

export async function setupPlaybackCore() {
  await AudioBrowser.setupPlayer({
    android: {
      allowedArtworkParentPaths: [],
      downsamplingProcessor: true,
    },
  })
  AudioBrowser.updateOptions(getAudioBrowserOptions())
}

export function isPlaybackCoreSetUp() {
  return true
}

export async function playFromTracks(options: {
  track: Track
  tracks: Track[]
  context: PlayerQueueContext | null
  shuffle: boolean
}) {
  const trackIds = options.tracks.map((t) => t.id)
  const listInfo = getUpdatedLists(trackIds, options.shuffle, options.track.id)
  const activeKey = listInfo.queue[0]
  const activeTrack = await playbackStore.getState().getTrack(activeKey!)
  if (!activeTrack) return false

  playbackStore.setState({
    isPlaying: true,
    lastPosition: 0,
    ...listInfo,
    activeKey,
    activeTrack,
  })

  await PlaybackControls.loadCurrentTrack()
  AudioBrowser.play()
  return true
}

export async function pausePlayback() {
  await PlaybackControls.pause()
}

export async function resumePlayback() {
  await PlaybackControls.play()
}

export async function togglePlaybackCore() {
  await PlaybackControls.playToggle()
}

export async function nextTrack(naturalProgression = false) {
  await PlaybackControls.next(naturalProgression)
}

export async function previousTrack() {
  await PlaybackControls.prev()
}

export async function playQueueIndex(index: number) {
  await PlaybackControls.playAtIndex(index)
}

export async function seekPlayback(seconds: number) {
  await PlaybackControls.seekTo(seconds)
}

export async function setPlaybackRepeatMode(mode: RepeatModeType) {
  repeatMode: switch (mode) {
    case "off":
      playbackStore.setState({ repeat: "no-repeat" })
      AudioBrowser.setRepeatMode("off")
      break
    case "queue":
      playbackStore.setState({ repeat: "repeat" })
      AudioBrowser.setRepeatMode("off")
      break
    case "track":
      playbackStore.setState({ repeat: "repeat-one" })
      AudioBrowser.setRepeatMode("track")
      break
  }
}
