import { describe, expect, it } from "vitest"

import { toDataAlbum, toDataArtist } from "@/modules/library/mappers"

describe("toDataAlbum", () => {
  it("maps a full album row", () => {
    expect(
      toDataAlbum({
        id: "a1",
        title: "Album",
        artwork: "art",
        isFavorite: 1,
        trackCount: 5,
        artist: { name: "Artist" },
      })
    ).toEqual({
      id: "a1",
      name: "Album",
      artwork: "art",
      artists: ["Artist"],
      isFavorite: true,
      trackCount: 5,
    })
  })

  it("handles a minimal row", () => {
    expect(
      toDataAlbum({
        id: "a2",
        title: "Solo",
        artwork: null,
        isFavorite: 0,
        trackCount: 0,
        artist: null,
      })
    ).toEqual({
      id: "a2",
      name: "Solo",
      artwork: null,
      artists: [],
      isFavorite: false,
      trackCount: 0,
    })
  })
})

describe("toDataArtist", () => {
  it("maps a full artist row", () => {
    expect(
      toDataArtist({
        id: "ar1",
        name: "Name",
        artwork: "art",
        isFavorite: 1,
        trackCount: 3,
        albumCount: 2,
      })
    ).toEqual({
      id: "ar1",
      name: "Name",
      artwork: "art",
      isFavorite: true,
      trackCount: 3,
      albumCount: 2,
    })
  })

  it("handles a minimal row", () => {
    expect(
      toDataArtist({
        id: "ar2",
        name: "N",
        artwork: null,
        isFavorite: 0,
        trackCount: 0,
        albumCount: 0,
      })
    ).toEqual({
      id: "ar2",
      name: "N",
      artwork: null,
      isFavorite: false,
      trackCount: 0,
      albumCount: 0,
    })
  })
})
