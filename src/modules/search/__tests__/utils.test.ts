import { describe, expect, it } from "vitest"

import type { GenreAlbumInfo } from "@/modules/search/types"
import {
  getPreviewAlbums,
  mapAlbumsToGridData,
  mapGenresToCategories,
} from "@/modules/search/utils"

describe("mapGenresToCategories", () => {
  it("assigns rainbow colors and patterns cyclically", () => {
    expect(mapGenresToCategories(["Rock", "Pop"])).toEqual([
      { id: "Rock", title: "Rock", color: "bg-rainbow-lime", pattern: "circles" },
      { id: "Pop", title: "Pop", color: "bg-rainbow-teal", pattern: "waves" },
    ])
  })

  it("wraps colors and patterns past the list length", () => {
    const categories = mapGenresToCategories(["a", "b", "c"])
    expect(categories[2]).toEqual({
      id: "c",
      title: "c",
      color: "bg-rainbow-cyan",
      pattern: "diamonds",
    })
  })
})

describe("getPreviewAlbums", () => {
  const albums = [
    { name: "A", year: 2020 },
    { name: "B", year: 2021 },
  ] as unknown as GenreAlbumInfo[]

  it("sorts by year descending and slices to the limit", () => {
    expect(getPreviewAlbums(albums, 8).map((a) => a.name)).toEqual(["B", "A"])
    expect(getPreviewAlbums(albums, 1).map((a) => a.name)).toEqual(["B"])
  })
})

describe("mapAlbumsToGridData", () => {
  it("sorts by year descending and maps grid rows", () => {
    const albums = [
      { name: "A", artist: "Ar", image: "i", trackCount: 5, year: 2020 },
      { name: "B", artist: null, year: 2021 },
    ] as unknown as GenreAlbumInfo[]

    expect(mapAlbumsToGridData(albums)).toEqual([
      {
        id: "B-0",
        title: "B",
        artist: "Unknown Artist",
        albumArtist: null,
        image: undefined,
        trackCount: undefined,
        year: 2021,
        dateAdded: 0,
      },
      {
        id: "A-1",
        title: "A",
        artist: "Ar",
        albumArtist: "Ar",
        image: "i",
        trackCount: 5,
        year: 2020,
        dateAdded: 0,
      },
    ])
  })
})
