import { useQuery } from "@tanstack/react-query"

import { TRACKS_KEY } from "@/domains/library/query-keys"

import { getAllTracks } from "./repository"
import type { DataTrack } from "./types"

export function useTracks() {
  return useQuery<DataTrack[]>({
    queryKey: [TRACKS_KEY],
    queryFn: getAllTracks,
  })
}
