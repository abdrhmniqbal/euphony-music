import AudioBrowser from "react-native-audio-browser"

import type { RepeatMode } from "../constants"
import { RepeatModes } from "../constants"
import { extractTrackId } from "../utils"
import { playbackStore } from "../store"

import { shuffleArray } from "@/utils/object"

export async function setRepeat(mode: RepeatMode) {
  playbackStore.setState({ repeat: mode })
  AudioBrowser.setRepeatMode(mode === RepeatModes.REPEAT_ONE ? "track" : "off")
}

export async function cycleRepeat() {
  const { repeat } = playbackStore.getState()
  let newMode: RepeatMode = RepeatModes.REPEAT
  if (repeat === RepeatModes.REPEAT) newMode = RepeatModes.REPEAT_ONE
  else if (repeat === RepeatModes.REPEAT_ONE) newMode = RepeatModes.NO_REPEAT

  await setRepeat(newMode)
}

export async function toggleShuffle() {
  const { shuffle, orderSnapshot, queue, activeKey } = playbackStore.getState()
  const newShuffleStatus = !shuffle

  if (queue.length === 0 || !activeKey) {
    playbackStore.setState({ shuffle: newShuffleStatus })
    return
  }

  let updatedQueue: string[] = queue
  let isOrderSnapshot = false
  if (newShuffleStatus) updatedQueue = shuffleArray(queue)
  else if (orderSnapshot.length === queue.length) {
    const referenceSet = orderSnapshot.reduce(
      (map, tId) => {
        if (map[tId]) map[tId]++
        else map[tId] = 1
        return map
      },
      {} as Record<string, number>
    )
    const canSwitch = queue.every((tKey) => {
      const tId = extractTrackId(tKey)
      if (referenceSet[tId] === undefined) return false
      referenceSet[tId]--
      if (referenceSet[tId] === 0) delete referenceSet[tId]
      return true
    })
    if (canSwitch) {
      isOrderSnapshot = true
      updatedQueue = orderSnapshot
    }
  }

  const trackKey = isOrderSnapshot ? extractTrackId(activeKey) : activeKey

  playbackStore.setState({
    shuffle: newShuffleStatus,
    queue: updatedQueue,
    activeKey: trackKey,
    queuePosition: updatedQueue.findIndex((id) => id === trackKey),
    numQueuedNext: 0,
  })
}
