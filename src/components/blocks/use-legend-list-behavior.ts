/**
 * Purpose: Centralizes LegendList behavior flags for item recycling updates.
 * Caller: Virtualized list blocks (track/album/artist/favorites/folder/playlist).
 * Dependencies: @legendapp/list refs.
 * Main Functions: useLegendListBehavior()
 * Side Effects: None.
 */

import type { LegendListRef } from "@legendapp/list/react-native"
import { useMemo, useRef } from "react"

interface LegendListBehaviorProps {
  maintainVisibleContentPosition: false
  dataVersion: string | undefined
}

export function useLegendListBehavior(
  resetScrollKey?: string,
  dataVersionKey?: string
) {
  const listRef = useRef<LegendListRef | null>(null)

  const dataVersion =
    resetScrollKey && dataVersionKey
      ? `${resetScrollKey}:${dataVersionKey}`
      : resetScrollKey ?? dataVersionKey

  const listBehaviorProps = useMemo<LegendListBehaviorProps>(
    () => ({
      maintainVisibleContentPosition: false,
      dataVersion,
    }),
    [dataVersion]
  )

  return {
    listRef,
    listBehaviorProps,
  }
}
