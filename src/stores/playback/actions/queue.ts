import { showAppToast } from "@/modules/ui/toast"
import { createId } from "@paralleldrive/cuid2"
import AudioBrowser from "react-native-audio-browser"

import type { Track } from "@/modules/tracks/types"
import { i18n } from "@/modules/localization/i18n"
import { preferenceStore } from "@/stores/preference/store"
import { playbackStore } from "../store"
import { extractTrackId, getTrackIdsList, getUpdatedLists } from "../utils"

import { clamp } from "@/utils/number"
import { moveArray } from "@/utils/object"
import { bgWait } from "@/utils/promise"
import { isString } from "@/utils/validation"
import { applyReplayGainToTrack } from "@/modules/audio/replay-gain/core/apply"

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

  const clampedToIndex = clamp(0, toIndex, queue.length - 1)

  let newQueuePosition = queuePosition
  if (fromIndex === queuePosition) newQueuePosition = clampedToIndex
  else if (fromIndex < queuePosition && clampedToIndex >= queuePosition) {
    newQueuePosition -= 1
  } else if (fromIndex > queuePosition && clampedToIndex <= queuePosition) {
    newQueuePosition += 1
  }

  let newNumQueuedNext = numQueuedNext
  const playNextStart = queuePosition + 1
  const playNextEnd = queuePosition + numQueuedNext
  if (isWithin(playNextStart, fromIndex, playNextEnd)) {
    if (!isWithin(playNextStart, clampedToIndex, playNextEnd)) newNumQueuedNext -= 1
  } else {
    if (isWithin(playNextStart, clampedToIndex, playNextEnd)) newNumQueuedNext = 0
  }

  playbackStore.setState({
    queue: moveArray(queue, { fromIndex, toIndex: clampedToIndex }),
    queuePosition: newQueuePosition,
    numQueuedNext: Math.max(0, newNumQueuedNext),
  })
}

export async function removeIds(ids: string[]) {
  const idSet = new Set(ids.map(extractTrackId))
  const { reset, getTrack, orderSnapshot, queue, activeTrack, queuePosition } =
    playbackStore.getState()

  if (!activeTrack) return

  let newQueuePosition = queuePosition
  const activeTrackRemoved = idSet.has(activeTrack.id)

  const updatedSnapshot = orderSnapshot.filter((tId) => !idSet.has(tId))
  const updatedQueue = queue.filter((tKey, index) => {
    const isRemoved = idSet.has(extractTrackId(tKey))
    if (isRemoved && index < queuePosition) newQueuePosition -= 1
    return !isRemoved
  })

  if (queue.length === updatedQueue.length) return
  if (updatedQueue.length === 0) return reset()

  let newActiveTrack: Track | undefined = activeTrack
  if (activeTrackRemoved) {
    const newActiveTrackKey = updatedQueue[newQueuePosition]
    if (newActiveTrackKey === undefined) return reset()
    newActiveTrack = await getTrack(newActiveTrackKey)
    if (!newActiveTrack) return

    await bgWait(250)
    AudioBrowser.load(await applyReplayGainToTrack(newActiveTrack))
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

export function removeKey(key: string) {
  const { queue, activeKey, queuePosition, numQueuedNext } = playbackStore.getState()

  if (!activeKey || key === activeKey) return

  let newQueuePosition = queuePosition
  let newNumQueuedNext = numQueuedNext

  const updatedQueue = queue.filter((tKey, index) => {
    const isRemoved = tKey === key
    if (isRemoved) {
      if (index < queuePosition) newQueuePosition -= 1
      else if (index <= queuePosition + numQueuedNext) newNumQueuedNext -= 1
    }
    return !isRemoved
  })

  if (queue.length === updatedQueue.length) return
  playbackStore.setState({
    queue: updatedQueue,
    queuePosition: newQueuePosition,
    numQueuedNext: Math.max(0, newNumQueuedNext),
  })
}

export async function synchronize() {
  const { getTrack, shuffle, playingFrom, activeTrack } = playbackStore.getState()

  if (!playingFrom || !activeTrack) return
  const updatedQueue = await getTrackIdsList(playingFrom)
  if (updatedQueue.length === 0) return
  const updatedListInfo = getUpdatedLists(updatedQueue, shuffle, activeTrack.id)

  const newTrackId = updatedListInfo.queue[updatedListInfo.queuePosition]!
  const isDiffTrack = activeTrack.id !== newTrackId
  let newTrack = activeTrack
  if (isDiffTrack) newTrack = (await getTrack(newTrackId))!

  playbackStore.setState({
    ...updatedListInfo,
    activeKey: newTrackId,
    activeTrack: newTrack,
  })

  if (isDiffTrack) AudioBrowser.load(await applyReplayGainToTrack(newTrack))
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
  const { queue, numQueuedNext } = playbackStore.getState()
  showAppToast(i18n.t("common.feedback.addedToQueue", { name }))

  if (queue.length === 0) return
  const uniqueId = createId()
  playbackStore.setState({
    queue: queue.toSpliced(
      afterQueuedNext ? after + numQueuedNext : after,
      0,
      ...(isString(id) ? [id] : id).map((i) => `${i}__${uniqueId}`)
    ),
    numQueuedNext: !afterQueuedNext ? 0 : numQueuedNext + (isString(id) ? 1 : id.length),
  })
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
