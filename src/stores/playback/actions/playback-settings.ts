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

async function cycleRepeat() {
  const { repeat } = playbackStore.getState()
  let newMode: RepeatMode = RepeatModes.REPEAT
  if (repeat === RepeatModes.REPEAT) newMode = RepeatModes.REPEAT_ONE
  else if (repeat === RepeatModes.REPEAT_ONE) newMode = RepeatModes.NO_REPEAT

  await setRepeat(newMode)
}

export async function toggleShuffle() {
  const { shuffle, orderSnapshot, queue, activeKey, queuePosition } = playbackStore.getState()
  const newShuffleStatus = !shuffle

  if (queue.length === 0 || !activeKey) {
    playbackStore.setState({ shuffle: newShuffleStatus })
    return
  }

  let updatedQueue: string[] = queue
  let newQueuePosition = queuePosition

  if (newShuffleStatus) {
    const played = queue.slice(0, newQueuePosition + 1)
    const remaining = queue.slice(newQueuePosition + 1)
    updatedQueue = [...played, ...shuffleArray(remaining)]
  } else if (orderSnapshot.length === queue.length) {
    const played = queue.slice(0, newQueuePosition + 1)
    const remaining = queue.slice(newQueuePosition + 1)

    const remainingCounts = remaining.reduce(
      (acc, id) => {
        acc[id] = (acc[id] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const orderedRemaining: string[] = []
    for (const id of orderSnapshot) {
      if (remainingCounts[id] && remainingCounts[id] > 0) {
        orderedRemaining.push(id)
        remainingCounts[id]--
      }
    }

    if (orderedRemaining.length === remaining.length) {
      updatedQueue = [...played, ...orderedRemaining]
    } else {
      updatedQueue = orderSnapshot
      newQueuePosition = updatedQueue.findIndex((id) => id === activeKey)
      if (newQueuePosition === -1) newQueuePosition = 0
    }
  }

  playbackStore.setState({
    shuffle: newShuffleStatus,
    queue: updatedQueue,
    queuePosition: newQueuePosition,
    numQueuedNext: 0,
  })
}
