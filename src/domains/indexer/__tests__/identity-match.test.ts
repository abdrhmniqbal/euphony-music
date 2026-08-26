import { describe, expect, it } from "vitest"

import { findBestMatch, matchScore, type TrackIdentityRow } from "@/domains/indexer/scan/identity-match"

function row(overrides: Partial<TrackIdentityRow> = {}): TrackIdentityRow {
  return {
    id: "track-a",
    title: "Song",
    duration: 200,
    audioBitrate: 320,
    audioSampleRate: 44100,
    audioCodec: "mp3",
    artistName: "Artist",
    albumTitle: "Album",
    playCount: 0,
    lastPlayedAt: null,
    rating: null,
    isFavorite: 0,
    favoritedAt: null,
    dateAdded: null,
    ...overrides,
  }
}

describe("matchScore", () => {
  it("scores identical signatures highest", () => {
    const score = matchScore(row(), row({ id: "track-b" }))
    expect(score).toBeGreaterThan(0)
  })

  it("rejects candidates outside the duration tolerance", () => {
    expect(matchScore(row(), row({ id: "track-b", duration: 210 }))).toBe(0)
  })

  it("accepts a rename with matching audio properties", () => {
    const score = matchScore(
      row(),
      row({ id: "track-b", title: "Renamed File", artistName: null })
    )
    expect(score).toBeGreaterThan(0)
  })

  it("accepts a retag when audio properties agree", () => {
    const score = matchScore(
      row({ title: "Old Title" }),
      row({ id: "track-b", title: "Completely Different" })
    )
    expect(score).toBeGreaterThan(0)
  })

  it("rejects unrelated files agreeing only on codec", () => {
    const score = matchScore(
      row(),
      row({
        id: "track-b",
        duration: 200.5,
        title: "Other Song",
        artistName: "Other Artist",
        audioBitrate: 128,
        audioSampleRate: 48000,
      })
    )
    expect(score).toBe(0)
  })

  it("rejects when duration agrees but nothing else does", () => {
    const score = matchScore(
      row({ audioBitrate: null, audioSampleRate: null, audioCodec: null }),
      row({
        id: "track-b",
        title: "Other Song",
        artistName: "Other Artist",
        audioBitrate: null,
        audioSampleRate: null,
        audioCodec: null,
      })
    )
    expect(score).toBe(0)
  })

  it("ignores case when comparing text signals", () => {
    const score = matchScore(row(), row({ id: "track-b", title: "SONG", artistName: "ARTIST" }))
    expect(score).toBeGreaterThan(0)
  })

  it("treats null-only pairs as non-matching signals", () => {
    const score = matchScore(
      row({ audioBitrate: null, audioSampleRate: null, audioCodec: null }),
      row({
        id: "track-b",
        title: "Song",
        artistName: "Artist",
        audioBitrate: null,
        audioSampleRate: null,
        audioCodec: null,
      })
    )
    // duration + title + artist agree
    expect(score).toBeGreaterThan(0)
  })
})

describe("findBestMatch", () => {
  it("prefers the candidate with more agreeing signals", () => {
    const fingerprint = row()
    const weak = row({ id: "track-weak", title: "Renamed File", artistName: null })
    const strong = row({ id: "track-strong" })
    expect(findBestMatch(fingerprint, [weak, strong])?.id).toBe("track-strong")
  })

  it("returns null when no candidate matches", () => {
    expect(findBestMatch(row(), [row({ id: "x", duration: 999 })])).toBeNull()
  })

  it("returns null for an empty pool", () => {
    expect(findBestMatch(row(), [])).toBeNull()
  })
})
