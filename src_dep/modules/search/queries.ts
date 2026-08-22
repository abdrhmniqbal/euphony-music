import { useQuery } from "@tanstack/react-query"

import { queryClient } from "@/lib/tanstack-query"

import {
  getAllGenres,
  getAlbumsByGenre,
  getAllTracksByGenre,
} from "@/modules/genres/repository"
import type { Track } from "@/modules/player/types"

import { searchKeys } from "./keys"
import type { GenreAlbumInfo, GenreDetailsResult } from "./types"

export async function getGenres(): Promise<string[]> {
  return getAllGenres()
}

export async function getGenreDetails(
  genreName: string
): Promise<GenreDetailsResult> {
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

export function useGenres() {
  return useQuery(
    {
      queryKey: searchKeys.genres(),
      queryFn: getGenres,
      placeholderData: (previousData) => previousData,
    },
    queryClient
  )
}

export function useGenreDetails(genreName: string) {
  return useQuery<GenreDetailsResult>(
    {
      queryKey: searchKeys.genreDetails(genreName),
      queryFn: async () => await getGenreDetails(genreName),
      enabled: genreName.length > 0,
      placeholderData: (previousData) => previousData,
    },
    queryClient
  )
}

export function useGenreTopTracks(genreName: string) {
  return useQuery(
    {
      queryKey: searchKeys.genreTopTracks(genreName),
      queryFn: async () => await getGenreTopTracks(genreName),
      enabled: genreName.length > 0,
      placeholderData: (previousData) => previousData,
    },
    queryClient
  )
}

export function useGenreAlbums(genreName: string) {
  return useQuery<GenreAlbumInfo[]>(
    {
      queryKey: searchKeys.genreAlbums(genreName),
      queryFn: async () => await getGenreAlbums(genreName),
      enabled: genreName.length > 0,
      placeholderData: (previousData) => previousData,
    },
    queryClient
  )
}
