import { create } from "zustand"

import type { DetailSortConfig, DetailSortField, SortOrder } from "@/domains/tracks/detail-sort"

export type { SortOrder }
export interface SortConfig {
  field: DetailSortField
  order: SortOrder
}

// Session-only per-screen sort state for detail screens; resets on app restart.
interface LibrarySortState {
  sortConfig: Record<string, DetailSortConfig>
}

const DEFAULT_SORT_CONFIG = {
  AlbumTracks: { field: "trackNumber", order: "asc" },
  ArtistTracks: { field: "title", order: "asc" },
  ArtistAlbums: { field: "year", order: "desc" },
} satisfies Record<string, DetailSortConfig>

export const useLibrarySortStore = create<LibrarySortState>(() => ({
  sortConfig: DEFAULT_SORT_CONFIG,
}))

export function setSortConfig(tab: string, field: DetailSortField, order?: SortOrder) {
  const currentSortConfig = useLibrarySortStore.getState().sortConfig
  const current = currentSortConfig[tab]
  if (current && current.field === field && !order) {
    useLibrarySortStore.setState({
      sortConfig: {
        ...currentSortConfig,
        [tab]: { field, order: current.order === "asc" ? "desc" : "asc" },
      },
    })
    return
  }

  useLibrarySortStore.setState({
    sortConfig: {
      ...currentSortConfig,
      [tab]: { field, order: order || "asc" },
    },
  })
}
