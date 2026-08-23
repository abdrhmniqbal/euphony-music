import { create } from "zustand"

export type SortOrder = "asc" | "desc"

export interface SortConfig {
  field: string
  order: SortOrder
}

// Session-only per-screen sort state for detail screens; resets on app restart.
interface LibrarySortState {
  sortConfig: Record<string, SortConfig>
}

const DEFAULT_SORT_CONFIG: Record<string, SortConfig> = {
  AlbumTracks: { field: "trackNumber", order: "asc" },
  ArtistTracks: { field: "title", order: "asc" },
  ArtistAlbums: { field: "title", order: "asc" },
}

export const useLibrarySortStore = create<LibrarySortState>(() => ({
  sortConfig: DEFAULT_SORT_CONFIG,
}))

export function setSortConfig(tab: string, field: string, order?: SortOrder) {
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
