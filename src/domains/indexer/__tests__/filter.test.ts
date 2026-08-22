import { describe, expect, it } from "vitest"
import type * as MediaLibrary from "expo-media-library/legacy"

import { isAllowedAssetUri, isSupportedAssetByExtension } from "@/domains/indexer/scan/filter"
import { normalizeMetadata, normalizeText } from "@/domains/indexer/metadata/normalize"

function asset(
  filename: string,
  uri = `file:///storage/emulated/0/Music/${filename}`
): MediaLibrary.Asset {
  return { filename, uri } as MediaLibrary.Asset
}

describe("isSupportedAssetByExtension", () => {
  it("accepts every supported extension regardless of case", () => {
    for (const ext of ["mp3", "flac", "aac", "ogg", "m4a", "opus", "wav"]) {
      expect(isSupportedAssetByExtension(asset(`song.${ext}`))).toBe(true)
      expect(isSupportedAssetByExtension(asset(`SONG.${ext.toUpperCase()}`))).toBe(true)
    }
  })

  it("rejects unsupported and missing extensions", () => {
    expect(isSupportedAssetByExtension(asset("note.pdf"))).toBe(false)
    expect(isSupportedAssetByExtension(asset("README"))).toBe(false)
    expect(isSupportedAssetByExtension(asset(""))).toBe(false)
  })

  it("falls back to empty filename safely", () => {
    expect(
      isSupportedAssetByExtension({ filename: undefined } as unknown as MediaLibrary.Asset)
    ).toBe(false)
  })
})

describe("isAllowedAssetUri", () => {
  it("rejects android system paths", () => {
    expect(isAllowedAssetUri("file:///android/data/com.foo/file.mp3")).toBe(false)
    expect(isAllowedAssetUri("content://media/android/obb/com.foo/file.mp3")).toBe(false)
    expect(isAllowedAssetUri("file:///storage/emulated/0/Android/file.mp3")).toBe(false)
  })

  it("rejects hidden directories and dotfiles", () => {
    expect(isAllowedAssetUri("file:///storage/Music/.nomedia/song.mp3")).toBe(false)
    expect(isAllowedAssetUri("file:///storage/.hidden/song.mp3")).toBe(false)
  })

  it("accepts normal user music paths", () => {
    expect(isAllowedAssetUri("file:///storage/emulated/0/Music/Album/song.mp3")).toBe(true)
    expect(isAllowedAssetUri("content://media/external/audio/media/42")).toBe(true)
  })
})

describe("normalizeText", () => {
  it("trims, strips BOM, and drops empty results", () => {
    expect(normalizeText("  Title  ")).toBe("Title")
    expect(normalizeText("﻿Title")).toBe("Title")
    expect(normalizeText("")).toBeUndefined()
    expect(normalizeText("   ")).toBeUndefined()
    expect(normalizeText(null)).toBeUndefined()
  })
})

describe("normalizeMetadata", () => {
  const base = {
    title: "  Raw Title  ",
    artist: "The Author",
    artists: [] as string[],
    album: "  Album Name  ",
    albumArtist: "  ",
    genres: ["  Rock ", "rock", "  POP "],
    rawArtist: "The Author",
    rawAlbumArtist: "  ",
    rawGenre: "  Rock ",
    composer: "  Composer  ",
    comment: "",
    lyrics: undefined,
    duration: 0,
  }

  it("trims fields and falls back to filename for missing title", () => {
    const result = normalizeMetadata({ ...base, title: "   " }, "my-song.mp3")
    expect(result.title).toBe("my-song")
    expect(result.artist).toBe("The Author")
    expect(result.album).toBe("Album Name")
  })

  it("uses normalized artist as albumArtist fallback", () => {
    const result = normalizeMetadata(base, "song.mp3")
    expect(result.albumArtist).toBe("The Author")
  })

  it("dedupes case-insensitive genres and resolves names", () => {
    const result = normalizeMetadata(base, "song.mp3")
    expect(result.genres).toEqual(["Rock", "POP"])
  })

  it("promotes a single normalized artist into the artists list", () => {
    const result = normalizeMetadata({ ...base, artists: [] }, "song.mp3")
    expect(result.artists).toEqual(["The Author"])
  })

  it("drops empty optional fields", () => {
    const result = normalizeMetadata(base, "song.mp3")
    expect(result.comment).toBeUndefined()
    expect(result.lyrics).toBeUndefined()
    expect(result.rawAlbumArtist).toBeUndefined()
  })
})
