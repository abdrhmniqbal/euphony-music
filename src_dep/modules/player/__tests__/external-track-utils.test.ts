import { describe, expect, it } from "vitest"

import {
  decodeUriRecursively,
  extractExternalUriTrackIds,
  getExternalFilename,
  getExternalTrackTitle,
  hashExternalTrackId,
  normalizeExternalIntentUri,
  normalizeUriForComparison,
} from "@/modules/player/external-track-utils"

describe("decodeUriRecursively", () => {
  it("decodes percent-encoded sequences", () => {
    expect(decodeUriRecursively("a%20b")).toBe("a b")
  })

  it("decodes repeatedly up to three times", () => {
    expect(decodeUriRecursively("a%2520b")).toBe("a b")
  })

  it("leaves plain strings unchanged", () => {
    expect(decodeUriRecursively("plain")).toBe("plain")
  })

  it("stops on invalid sequences", () => {
    expect(decodeUriRecursively("%ZZ")).toBe("%ZZ")
  })
})

describe("normalizeExternalIntentUri", () => {
  it("repairs single-slash content schemes", () => {
    expect(normalizeExternalIntentUri("content:/foo")).toBe("content://foo")
  })

  it("repairs single-slash file schemes", () => {
    expect(normalizeExternalIntentUri("file:/x")).toBe("file:///x")
  })

  it("trims surrounding whitespace", () => {
    expect(normalizeExternalIntentUri("  file:/x  ")).toBe("file:///x")
  })

  it("leaves already-normalized URIs untouched", () => {
    expect(normalizeExternalIntentUri("content://already")).toBe("content://already")
    expect(normalizeExternalIntentUri("https://x")).toBe("https://x")
  })
})

describe("normalizeUriForComparison", () => {
  it("strips query and fragment and trailing slashes", () => {
    expect(normalizeUriForComparison("file:///a/b/?x=1#y ")).toBe("file:///a/b")
  })
})

describe("extractExternalUriTrackIds", () => {
  it("extracts a document-tree id", () => {
    const uri = "content://com.android.externalstorage.documents/document/audio%3A123"
    expect(extractExternalUriTrackIds(uri)).toEqual(new Set(["123"]))
  })

  it("extracts a media-store id", () => {
    // The generic /media/ pattern also captures the "external" segment; this
    // baseline locks that current fuzzy behavior so refactors preserve it.
    expect(extractExternalUriTrackIds("content://media/external/audio/media/456")).toEqual(
      new Set(["456", "external"])
    )
  })

  it("ignores the query string when matching", () => {
    expect(extractExternalUriTrackIds("content://media/external/audio/media/456?x=1")).toEqual(
      new Set(["456", "external"])
    )
  })
})

describe("getExternalTrackTitle", () => {
  it("returns the filename without its extension", () => {
    expect(getExternalTrackTitle("file:///a/b/song%20name.mp3")).toBe("song name")
  })

  it("returns the filename when there is no extension", () => {
    expect(getExternalTrackTitle("file:///x/noext")).toBe("noext")
  })
})

describe("getExternalFilename", () => {
  it("returns the last path segment, ignoring query and fragment", () => {
    expect(getExternalFilename("file:///a/b/song.mp3?x=1")).toBe("song.mp3")
  })
})

describe("hashExternalTrackId", () => {
  it("is deterministic and has the expected shape", () => {
    const id = hashExternalTrackId("uri1")
    expect(id).toMatch(/^external-indexed:[0-9a-f]{16}$/)
    expect(hashExternalTrackId("uri1")).toBe(id)
  })

  it("differs for different input", () => {
    expect(hashExternalTrackId("a")).not.toBe(hashExternalTrackId("b"))
  })
})
