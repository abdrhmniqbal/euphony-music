import AudioBrowser from "react-native-audio-browser"

import {
  extractTrackId,
  flushPlaybackStoreSnapshot,
  playbackStore,
  setPlaybackLastPosition,
} from "../playback-store"
import { isAudioBrowserSetUp } from "@/lib/audio-browser"
import { toNativeTrack } from "../native-track"

export async function loadCurrentTrack() {
  const { _hasRestoredPosition, _restoredTrackKey, lastPosition, activeTrack } =
    playbackStore.getState()
  if (!activeTrack) return
  const nativeTrack = toNativeTrack(activeTrack)
  await AudioBrowser.load(nativeTrack)
  AudioBrowser.updateNowPlaying(nativeTrack)

  if (!_hasRestoredPosition) {
    playbackStore.setState({ _hasRestoredPosition: true })
    if (_restoredTrackKey !== undefined && extractTrackId(_restoredTrackKey) === activeTrack.id) {
      await seekTo(lastPosition ?? 0)
    }
  }
}

export async function restoreCurrentTrackForStartup() {
  if (await isAudioBrowserSetUp()) {
    let nativePlaying = false
    try {
      nativePlaying = AudioBrowser.getPlayingState().playing
    } catch {
      // safe fallback
    }
    playbackStore.setState({
      _hasRestoredPosition: true,
      isPlaying: nativePlaying,
    })
    return
  }

  const shouldResumePlayback = playbackStore.getState().isPlaying
  await loadCurrentTrack()
  if (shouldResumePlayback && playbackStore.getState().activeTrack) {
    await AudioBrowser.play()
  }
}

async function preloadCurrentTrack() {
  if (await isAudioBrowserSetUp()) return
  await loadCurrentTrack()
}

type PlayPauseOptions = {
  noRevalidation?: boolean
}

export async function play(_opts?: PlayPauseOptions) {
  playbackStore.setState({ isPlaying: true })
  await preloadCurrentTrack()
  await AudioBrowser.play()
  void flushPlaybackStoreSnapshot()
}

export async function pause(_opts?: PlayPauseOptions) {
  playbackStore.setState({ isPlaying: false })
  AudioBrowser.pause()
  void flushPlaybackStoreSnapshot()
}

async function stop() {
  playbackStore.setState({
    isPlaying: false,
    _hasRestoredPosition: false,
    _restoredTrackKey: playbackStore.getState().activeKey,
  })
  AudioBrowser.reset()
  void flushPlaybackStoreSnapshot()
}

export async function playToggle(opts?: PlayPauseOptions) {
  if (playbackStore.getState().isPlaying) await pause(opts)
  else await play(opts)
}

export async function prev() {
  const { getTrack, lastPosition, queue, queuePosition } = playbackStore.getState()

  const prevIndex = queuePosition === 0 ? queue.length - 1 : queuePosition - 1
  const prevTrackKey = queue[prevIndex]
  if (!prevTrackKey) return
  const prevTrack = await getTrack(prevTrackKey)
  if (!prevTrack) return

  if (lastPosition <= 10 || !(await isAudioBrowserSetUp())) {
    playbackStore.setState({
      lastPosition: 0,
      activeKey: prevTrackKey,
      activeTrack: prevTrack,
      queuePosition: prevIndex,
      numQueuedNext: 0,
    })
  } else {
    playbackStore.setState({ lastPosition: 0 })
  }

  await loadCurrentTrack()
}

export async function next(naturalProgression = false) {
  const { repeat, activeKey, activeTrack, queue, queuePosition } = playbackStore.getState()

  if (naturalProgression && repeat === "repeat-one" && activeKey && activeTrack) {
    playbackStore.setState({
      lastPosition: 0,
      activeKey,
      activeTrack,
    })
    await loadCurrentTrack()
    await play({ noRevalidation: true })
    return
  }

  const isAtQueueEnd = queuePosition === queue.length - 1
  if (naturalProgression && isAtQueueEnd && repeat === "no-repeat") {
    await stop()
    return
  }

  const nextTrackContext = await getNextTrack()
  if (!nextTrackContext) return

  playbackStore.setState({
    ...nextTrackContext,
  })

  await loadCurrentTrack()

  if (naturalProgression) {
    await play({ noRevalidation: true })
  }
}

export async function seekTo(position: number) {
  await preloadCurrentTrack()
  setPlaybackLastPosition(position)
  await AudioBrowser.seekTo(position)
}

export async function playAtIndex(index: number) {
  const { getTrack, reset, queue, queuePosition, numQueuedNext } = playbackStore.getState()

  const nextTrackKey = queue[index]
  if (!nextTrackKey) return await reset()
  const nextTrack = await getTrack(nextTrackKey)
  if (!nextTrack) return

  playbackStore.setState({
    lastPosition: 0,
    activeKey: nextTrackKey,
    activeTrack: nextTrack,
    queuePosition: index,
    numQueuedNext: index < queuePosition ? 0 : Math.max(0, numQueuedNext - (index - queuePosition)),
  })

  await loadCurrentTrack()
  await play()
}

async function getNextTrack() {
  const { getTrack, reset, queue, queuePosition, numQueuedNext } = playbackStore.getState()

  const nextIndex = queuePosition === queue.length - 1 ? 0 : queuePosition + 1
  const nextTrackKey = queue[nextIndex]
  if (!nextTrackKey) return await reset()
  const nextTrack = await getTrack(nextTrackKey)
  if (!nextTrack) return

  return {
    lastPosition: 0,
    activeKey: nextTrackKey,
    activeTrack: nextTrack,
    queuePosition: nextIndex,
    numQueuedNext: nextIndex === 0 ? 0 : Math.max(0, numQueuedNext - 1),
  }
}
