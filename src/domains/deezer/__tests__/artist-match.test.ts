import { describe, expect, it } from "vitest"

import { selectArtistCandidate } from "@/domains/deezer/artist-match"

describe("selectArtistCandidate", () => {
  const candidates = [
    { id: 1, name: "Jungkook", nb_fan: 3009 },
    { id: 2, name: "Jung Kook", nb_fan: 460059 },
  ]

  it("prefers an exact case-sensitive name match over a higher-fan normalized imposter", () => {
    expect(selectArtistCandidate(candidates, "Jung Kook")?.id).toBe(2)
  })

  it("treats case difference as a different artist when no exact match exists", () => {
    expect(selectArtistCandidate(candidates, "jungkook")?.id).toBe(1)
  })

  it("falls back to a normalized match when no exact case match exists", () => {
    expect(selectArtistCandidate([{ id: 3, name: "jung kook", nb_fan: 5 }], "JUNGKOOK")?.id).toBe(3)
  })

  it("returns undefined for an empty candidate list", () => {
    expect(selectArtistCandidate([], "Any")).toBeUndefined()
  })
})
