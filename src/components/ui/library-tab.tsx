/**
 * Purpose: Shared wrapper around LibraryTabState that injects common content
 * props (contentContainerStyle, resetScrollKey, refreshControl, scroll
 * passthroughs) into the grid/list child via cloneElement.
 *
 * Each tab still handles its own query + mapping + sort (type-specific),
 * but this eliminates the 6-line prop spreading boilerplate per tab.
 */

import type { RefreshControlProps, StyleProp, ViewStyle } from "react-native"
import * as React from "react"
import { LibraryTabState } from "@/components/ui/library-tab-state"

interface LibraryTabProps {
  hasData: boolean
  emptyIcon: React.ReactNode
  emptyTitle: string
  emptyMessage: string
  contentBottomPadding: number
  resetScrollKey: string
  refreshControl?: React.ReactElement<RefreshControlProps> | null
  autoHideScrollProps: Record<string, unknown>
  children: React.ReactElement
}

export function LibraryTab({
  hasData,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  contentBottomPadding,
  resetScrollKey,
  refreshControl,
  autoHideScrollProps,
  children,
}: LibraryTabProps) {
  return (
    <LibraryTabState
      hasData={hasData}
      emptyIcon={emptyIcon}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
    >
      {React.cloneElement(children, {
        contentContainerStyle: { paddingBottom: contentBottomPadding } as StyleProp<ViewStyle>,
        resetScrollKey,
        refreshControl,
        ...autoHideScrollProps,
      })}
    </LibraryTabState>
  )
}
