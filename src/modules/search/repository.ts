/**
 * Purpose: Provides genre search and detail read models for library screens.
 * Caller: search queries and genre detail routes.
 * Dependencies: genres repository and player track types.
 * Main Functions: getGenres(), getGenreDetails(), getGenreTopTracks(), getGenreAlbums()
 * Side Effects: Reads genre, album, and track rows from SQLite through repository calls.
 */

import type { Track } from "@/modules/player/types"
import { getAlbumsByGenre, getAllGenres, getAllTracksByGenre } from "@/modules/genres/repository"

import type { GenreAlbumInfo } from "./types"

export async function getGenres(): Promise<string[]> {
  return getAllGenres()
}

export async function getGenreDetails(
  genreName: string
): Promise<{ topTracks: Track[]; albums: GenreAlbumInfo[] }> {
  const [topTracks, albums] = await Promise.all([
    getAllTracksByGenre(genreName),
    getAlbumsByGenre(genreName),
  ])

  return { topTracks, albums }
}

export async function getGenreTopTracks(genreName: string): Promise<Track[]> {
  return getAllTracksByGenre(genreName)
}

export async function getGenreAlbums(genreName: string): Promise<GenreAlbumInfo[]> {
  return getAlbumsByGenre(genreName)
}
