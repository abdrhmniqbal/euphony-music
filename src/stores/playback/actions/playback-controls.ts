import AudioBrowser from "react-native-audio-browser"

import { addPlayedMediaList } from "@/modules/history/repository"
import { RepeatModes } from "../constants"
import { createPlaybackQueueContext, type PlayFromSource } from "../types"
import {
  arePlaybackSourceEqual,
  extractTrackId,
  getSourceName,
  getTrackIdsList,
  getUpdatedLists,
} from "../utils"
import { flushPlaybackStoreSnapshot, playbackStore, setPlaybackLastPosition } from "../store"

import { isAudioBrowserSetUp } from "@/lib/react-native-audio-browser"
import { applyReplayGainToTrack } from "@/modules/audio/replay-gain/core/apply"
import { revalidateWidgets } from "@/modules/widget/utils"

export async function loadCurrentTrack() {
  const { _hasRestoredPosition, _restoredTrackKey, lastPosition, activeTrack } =
    playbackStore.getState()
  if (!activeTrack) return
  await AudioBrowser.load(await applyReplayGainToTrack(activeTrack))

  if (!_hasRestoredPosition) {
    playbackStore.setState({ _hasRestoredPosition: true })
    if (_restoredTrackKey !== undefined && extractTrackId(_restoredTrackKey) === activeTrack.id) {
      await seekTo(lastPosition ?? 0)
    }
  }
}

export async function syncPlaybackStateFromNative() {
  try {
    const progress = AudioBrowser.getProgress()
    const isPlaying = AudioBrowser.getPlayingState().playing
    playbackStore.setState({
      isPlaying,
      lastPosition: Math.max(0, progress.position ?? playbackStore.getState().lastPosition),
    })
    await flushPlaybackStoreSnapshot()
    return true
  } catch {
    return false
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

export async function preloadCurrentTrack() {
  if (await isAudioBrowserSetUp()) return
  console.log("[AudioBrowser] Queue is empty, preloading AudioBrowser Queue...")
  await loadCurrentTrack()
}

type PlayPauseOptions = {
  noRevalidation?: boolean
}

export async function play(opts?: PlayPauseOptions) {
  playbackStore.setState({ isPlaying: true })
  await preloadCurrentTrack()
  await AudioBrowser.play()
  if (!opts?.noRevalidation) revalidateWidgets({ exclude: ["ArtworkPlayer"] })
}

export async function pause(opts?: PlayPauseOptions) {
  playbackStore.setState({ isPlaying: false })
  AudioBrowser.pause()
  if (!opts?.noRevalidation) revalidateWidgets({ exclude: ["ArtworkPlayer"] })
}

export async function stop() {
  playbackStore.setState({
    isPlaying: false,
    _hasRestoredPosition: false,
    _restoredTrackKey: playbackStore.getState().activeKey,
  })
  AudioBrowser.reset()
  revalidateWidgets({ openApp: true })
}

export async function playToggle(opts?: PlayPauseOptions) {
  if (playbackStore.getState().isPlaying) await pause(opts)
  else await play(opts)
}

export async function prev() {
  const { getTrack, reset, lastPosition, queue, queuePosition } = playbackStore.getState()

  const prevIndex = queuePosition === 0 ? queue.length - 1 : queuePosition - 1
  const prevTrackKey = queue[prevIndex]
  if (!prevTrackKey) return await reset()
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
  const { activeKey, activeTrack, queue, queuePosition, repeat } = playbackStore.getState()

  if (naturalProgression && repeat === RepeatModes.REPEAT_ONE && activeKey && activeTrack) {
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
  if (naturalProgression && isAtQueueEnd && repeat === RepeatModes.NO_REPEAT) {
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

export async function playFromList({
  source,
  trackId,
}: {
  source: PlayFromSource
  trackId?: string
}) {
  const { getTrack, shuffle, playingFrom, queue, activeTrack } = playbackStore.getState()

  const isSameSource = arePlaybackSourceEqual(playingFrom, source)
  let isDiffTrack = activeTrack === undefined || activeTrack.id !== trackId

  if (isSameSource) {
    handleSameSource: {
      if (!!trackId && isDiffTrack) {
        const listIndex = queue.findIndex((id) => extractTrackId(id) === trackId)
        if (listIndex === -1) break handleSameSource
        playbackStore.setState({
          lastPosition: 0,
          activeKey: queue[listIndex],
          activeTrack: (await getTrack(trackId))!,
          queuePosition: listIndex,
          numQueuedNext: 0,
        })
        await loadCurrentTrack()
      }
      return await play()
    }
  }

  const newPlayingList = await getTrackIdsList(source)
  if (newPlayingList.length === 0) return
  const newListInfo = getUpdatedLists(newPlayingList, shuffle, trackId ?? activeTrack?.id)

  const newTrackId = newListInfo.queue[newListInfo.queuePosition]!
  isDiffTrack = activeTrack?.id !== newTrackId
  let newTrack = activeTrack
  if (isDiffTrack) newTrack = await getTrack(newTrackId)

  const sourceName = await getSourceName(source)
  playbackStore.setState({
    isPlaying: true,
    ...(isDiffTrack ? { lastPosition: 0 } : {}),
    ...newListInfo,
    playingFrom: source,
    playingFromName: sourceName,
    queueContext: createPlaybackQueueContext(source.type, sourceName),
    activeKey: newTrackId,
    activeTrack: newTrack,
  })

  if (isDiffTrack || !(await isAudioBrowserSetUp())) await loadCurrentTrack()
  await AudioBrowser.play()

  addPlayedMediaList(source)
}

export async function getNextTrack() {
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
