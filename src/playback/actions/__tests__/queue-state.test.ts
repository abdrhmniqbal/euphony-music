import { describe, expect, it } from "vitest"

import {
  calculateInsertIntoQueueState,
  calculateMoveTrackState,
  calculateRemoveIdsState,
} from "../queue-state"

describe("calculateMoveTrackState", () => {
  it("moves a track and keeps queuePosition pointing at the active track", () => {
    const state = calculateMoveTrackState(["a", "b", "c"], 0, 0, 2, 0)
    expect(state.queue).toEqual(["c", "a", "b"])
    expect(state.queuePosition).toBe(1)
  })
})

describe("calculateRemoveIdsState", () => {
  it("removes non-active tracks and keeps the position on the active track", () => {
    const state = calculateRemoveIdsState(["a", "b", "c"], ["a", "b", "c"], 1, "b", ["a", "c"])
    expect(state.queue).toEqual(["b"])
    expect(state.activeTrackRemoved).toBe(false)
    expect(state.queuePosition).toBe(0)
  })

  it("keeps the active track even when explicitly requested for removal", () => {
    const state = calculateRemoveIdsState(["a", "b", "c"], ["a", "b", "c"], 2, "c", ["a", "b", "c"])
    expect(state.queue).toEqual(["c"])
    // Flag only signals that the active slot must be reloaded.
    expect(state.activeTrackRemoved).toBe(true)
    expect(state.queuePosition).toBe(0)
  })

  it("keeps playing the active track when it is among the removed ids", () => {
    const state = calculateRemoveIdsState(["a", "b", "c"], ["a", "b", "c"], 1, "b", ["b"])
    expect(state.queue).toEqual(["a", "b", "c"])
    expect(state.activeTrackRemoved).toBe(true)
    expect(state.queuePosition).toBe(1)
  })
})

describe("calculateInsertIntoQueueState", () => {
  it("inserts after the current track and keeps the active position stable", () => {
    const state = calculateInsertIntoQueueState(["a", "b"], 0, 0, ["x", "y"], false, 1, "uid")
    expect(state.queue).toEqual(["a", "x", "y", "b"])
    expect(state.queuePosition).toBe(0)
  })

  it("suffixes duplicate keys so the same track can appear twice", () => {
    const state = calculateInsertIntoQueueState(["a", "b"], 0, 0, "a", false, 2, "uid")
    expect(state.queue).toEqual(["a", "b", "a__uid"])
  })

  it("tracks numQueuedNext when inserting in queued-next mode", () => {
    const state = calculateInsertIntoQueueState(["a", "b", "c"], 0, 1, ["x"], true, 1, "uid")
    expect(state.numQueuedNext).toBe(2)
    expect(state.queue[1]).toBe("x")
  })
})
