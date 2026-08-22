import { showAppToast } from "@/modules/ui/toast"
import { createId } from "@paralleldrive/cuid2"
import AudioBrowser from "react-native-audio-browser"

import type { Track } from "@/modules/tracks/types"
import { i18n } from "@/modules/localization/i18n"
import { preferenceStore } from "@/stores/preference/store"
import { playbackStore } from "../store"
import { extractTrackId } from "../pure-utils"

import { clamp } from "@/utils/number"
import { moveArray } from "@/utils/object"
import { bgWait } from "@/utils/promise"
import { isString } from "@/utils/validation"
import { applyReplayGainToTrack } from "@/modules/audio/replay-gain/core/apply"

import { calculateMoveTrackState, calculateRemoveIdsState, calculateInsertIntoQueueState } from "./queue-state"

interface QueueInsertionProps {
  id: string | string[]
  name: string
  afterQueuedNext?: boolean
}

export function add({ id, name }: QueueInsertionProps) {
  const { queuePosition } = playbackStore.getState()
  const { queueAwareNext } = preferenceStore.getState()
  insertIntoQueue({
    id,
    name,
    afterQueuedNext: queueAwareNext,
    after: queuePosition + 1,
  })
}

export function addToEnd({ id, name }: QueueInsertionProps) {
  const { queue } = playbackStore.getState()
  insertIntoQueue({ id, name, after: queue.length })
}

export function moveTrack(fromIndex: number, toIndex: number) {
  const { queue, queuePosition, numQueuedNext } = playbackStore.getState()
  const nextState = calculateMoveTrackState(queue, queuePosition, numQueuedNext, fromIndex, toIndex)
  playbackStore.setState(nextState)
}

export async function removeIds(ids: string[]) {
  const { reset, getTrack, orderSnapshot, queue, activeTrack, queuePosition } =
    playbackStore.getState()

  if (!activeTrack) return

  const { activeTrackRemoved, orderSnapshot: updatedSnapshot, queue: updatedQueue, queuePosition: newQueuePosition } =
    calculateRemoveIdsState(orderSnapshot, queue, queuePosition, activeTrack.id, ids)

  if (queue.length === updatedQueue.length) return
  if (updatedQueue.length === 0) return reset()

  let newActiveTrack: Track | undefined = activeTrack
  if (activeTrackRemoved) {
    const newActiveTrackKey = updatedQueue[newQueuePosition]
    if (newActiveTrackKey === undefined) return reset()
    newActiveTrack = await getTrack(newActiveTrackKey)
    if (!newActiveTrack) return

    await bgWait(250)
    const nativeTrack = await applyReplayGainToTrack(newActiveTrack)
    AudioBrowser.load(nativeTrack)
    AudioBrowser.updateNowPlaying(nativeTrack)
  }

  playbackStore.setState({
    orderSnapshot: updatedSnapshot,
    queue: updatedQueue,
    activeKey: updatedQueue[newQueuePosition],
    activeTrack: newActiveTrack,
    queuePosition: newQueuePosition,
    numQueuedNext: 0,
  })
}

function isWithin(min: number, value: number, max: number) {
  return value >= min && value <= max
}

function insertIntoQueue({
  id,
  name,
  afterQueuedNext = false,
  after,
}: QueueInsertionProps & { after: number }) {
  const { queue, queuePosition, numQueuedNext } = playbackStore.getState()
  showAppToast(i18n.t("common.feedback.addedToQueue", { name }))

  if (queue.length === 0) return
  const uniqueId = createId()
  const nextState = calculateInsertIntoQueueState(
    queue,
    queuePosition,
    numQueuedNext,
    id,
    afterQueuedNext,
    after,
    uniqueId
  )
  playbackStore.setState(nextState)
}

export function clearToCurrent() {
  const { activeKey, activeTrack } = playbackStore.getState()
  if (!activeKey || !activeTrack) return
  playbackStore.setState({
    orderSnapshot: [activeTrack.id],
    queue: [activeKey],
    queuePosition: 0,
    numQueuedNext: 0,
  })
}
