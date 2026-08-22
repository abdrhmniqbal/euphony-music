import { describe, expect, it } from "vitest"

import type { DBAlbum, DBArtist, DBTrack } from "@/types/database"
import {
  transformDBAlbumToAlbum,
  transformDBArtistToArtist,
  transformDBTrackToTrack,
} from "@/utils/transformers"

describe("transformDBTrackToTrack", () => {
  it("maps core fields and joins artists, album, and genres", () => {
    const dbTrack = {
      id: "t1",
      title: "Song",
      duration: 200,
      uri: "file:///x.mp3",
      artistId: "a1",
      albumId: "al1",
      artist: { name: "Alpha" },
      featuredArtists: [{ artist: { name: "Beta" } }],
      album: { title: "Album", artwork: "album-art", artist: { name: "AlbumArtist" } },
      genres: [{ genre: { name: "Rock" } }, { genre: { name: "Pop" } }],
      artwork: "track-art",
      lyrics: "\uFEFFla la la",
      playCount: 5,
      isDeleted: 0,
      isFavorite: 1,
      year: 2020,
      filename: "x.mp3",
      dateAdded: 123,
      discNumber: 1,
      trackNumber: 2,
      audioBitrate: 320,
      audioSampleRate: 44100,
      audioCodec: "mp3",
      audioFormat: "mpeg",
      fileHash: "h",
      scanTime: 9,
    } as unknown as DBTrack

    const track = transformDBTrackToTrack(dbTrack)

    expect(track).toEqual({
      id: "t1",
      title: "Song",
      artist: "Alpha, Beta",
      artistId: "a1",
      albumArtist: "AlbumArtist",
      album: "Album",
      albumId: "al1",
      duration: 200,
      uri: "file:///x.mp3",
      image: "track-art",
      albumArtwork: "album-art",
      audioBitrate: 320,
      audioSampleRate: 44100,
      audioCodec: "mp3",
      audioFormat: "mpeg",
      lyrics: "la la la",
      fileHash: "h",
      scanTime: 9,
      isDeleted: false,
      playCount: 5,
      lastPlayedAt: undefined,
      year: 2020,
      filename: "x.mp3",
      dateAdded: 123,
      isFavorite: true,
      discNumber: 1,
      trackNumber: 2,
      genre: "Rock, Pop",
      isExternal: undefined,
    })
  })

  it("dedupes artists and genres case-insensitively", () => {
    const dbTrack = {
      id: "t2",
      title: "Dedupe",
      duration: 10,
      uri: "file:///y.mp3",
      artist: { name: "Alpha" },
      featuredArtists: [{ artist: { name: "alpha" } }],
      album: null,
      genres: [{ genre: { name: "Rock" } }, { genre: { name: "rock" } }],
    } as unknown as DBTrack

    const track = transformDBTrackToTrack(dbTrack)

    expect(track.artist).toBe("Alpha")
    expect(track.albumArtist).toBe("Alpha")
    expect(track.genre).toBe("Rock")
  })
})

describe("transformDBAlbumToAlbum", () => {
  it("maps album fields with a fallback artist", () => {
    const dbAlbum = {
      id: "al1",
      title: "Album",
      artist: { name: "Artist" },
      artwork: "art",
      trackCount: 5,
      year: 2020,
      createdAt: 123,
    } as unknown as DBAlbum

    expect(transformDBAlbumToAlbum(dbAlbum)).toEqual({
      id: "al1",
      title: "Album",
      artist: "Artist",
      albumArtist: "Artist",
      image: "art",
      trackCount: 5,
      year: 2020,
      dateAdded: 123,
    })
  })

  it("falls back to Unknown Artist", () => {
    const dbAlbum = {
      id: "al2",
      title: "Unknown",
      artist: null,
      artwork: null,
      trackCount: 0,
      year: 0,
      createdAt: 0,
    } as unknown as DBAlbum

    expect(transformDBAlbumToAlbum(dbAlbum).artist).toBe("Unknown Artist")
  })
})

describe("transformDBArtistToArtist", () => {
  it("maps artist fields", () => {
    const dbArtist = {
      id: "ar1",
      name: "Name",
      artwork: "art",
      trackCount: 3,
      createdAt: 7,
    } as unknown as DBArtist

    expect(transformDBArtistToArtist(dbArtist)).toEqual({
      id: "ar1",
      name: "Name",
      trackCount: 3,
      image: "art",
      dateAdded: 7,
    })
  })
})
