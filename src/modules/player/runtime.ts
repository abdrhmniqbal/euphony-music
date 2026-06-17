let playerQueueReplacementDepth = 0

export function beginPlayerQueueReplacement() {
  playerQueueReplacementDepth += 1
}

export function endPlayerQueueReplacement() {
  playerQueueReplacementDepth = Math.max(0, playerQueueReplacementDepth - 1)
}

export function isPlayerQueueReplacementInFlight() {
  return playerQueueReplacementDepth > 0
}
