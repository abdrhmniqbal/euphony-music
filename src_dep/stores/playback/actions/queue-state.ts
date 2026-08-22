import { clamp } from "@/utils/number"
import { moveArray } from "@/utils/object"

export interface MoveTrackState {
  queue: string[]
  queuePosition: number
  numQueuedNext: number
}

export function calculateMoveTrackState(
  queue: string[],
  queuePosition: number,
  numQueuedNext: number,
  fromIndex: number,
  toIndex: number
): MoveTrackState {
  const nextQueue = moveArray(queue, { fromIndex, toIndex })
  return {
    queue: nextQueue,
    queuePosition: nextQueue.indexOf(queue[queuePosition]!),
    numQueuedNext,
  }
}

export interface RemoveIdsState {
  activeTrackRemoved: boolean
  orderSnapshot: string[]
  queue: string[]
  queuePosition: number
}

export function calculateRemoveIdsState(
  orderSnapshot: string[],
  queue: string[],
  queuePosition: number,
  activeTrackId: string,
  ids: string[]
): RemoveIdsState {
  const removeSet = new Set(ids)
  const nextQueue = queue.filter((key, index) => index === queuePosition || !removeSet.has(key))
  const activeTrackRemoved = removeSet.has(queue[queuePosition]!)
  const nextQueuePosition = activeTrackRemoved
    ? clamp(queuePosition, 0, Math.max(0, nextQueue.length - 1))
    : nextQueue.indexOf(queue[queuePosition]!)
  return {
    activeTrackRemoved,
    orderSnapshot,
    queue: nextQueue,
    queuePosition: nextQueuePosition,
  }
}

export interface InsertIntoQueueState {
  orderSnapshot: string[]
  queue: string[]
  queuePosition: number
  numQueuedNext: number
}

export function calculateInsertIntoQueueState(
  queue: string[],
  queuePosition: number,
  numQueuedNext: number,
  id: string | string[],
  afterQueuedNext: boolean,
  after: number,
  uniqueId: string
): InsertIntoQueueState {
  const ids = Array.isArray(id) ? id : [id]
  const insertKeys = ids.map((trackId) =>
    queue.includes(trackId) ? `${trackId}__${uniqueId}` : trackId
  )
  const insertAt = afterQueuedNext
    ? clamp(after, 0, queue.length)
    : clamp(after, 0, queue.length)
  const nextQueue = [...queue.slice(0, insertAt), ...insertKeys, ...queue.slice(insertAt)]
  const activeKey = queue[queuePosition]
  const nextQueuePosition = activeKey ? nextQueue.indexOf(activeKey) : queuePosition
  const nextNumQueuedNext = afterQueuedNext ? numQueuedNext + insertKeys.length : numQueuedNext
  return {
    orderSnapshot: nextQueue,
    queue: nextQueue,
    queuePosition: nextQueuePosition === -1 ? queuePosition : nextQueuePosition,
    numQueuedNext: nextNumQueuedNext,
  }
}
