import { create } from "zustand"

import { DEFAULT_SORT_CONFIG } from "@/modules/library/sort-constants"
import type { SortConfig, SortField, SortOrder, TabName } from "@/modules/library/sort-types"

interface LibrarySortState {
  sortConfig: Record<TabName, SortConfig>
}

export const useLibrarySortStore = create<LibrarySortState>(() => ({
  sortConfig: DEFAULT_SORT_CONFIG,
}))

export function setSortConfig(tab: TabName, field: SortField, order?: SortOrder) {
  const currentSortConfig = useLibrarySortStore.getState().sortConfig
  const current = currentSortConfig[tab]
  if (current.field === field && !order) {
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
