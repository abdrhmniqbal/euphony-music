import * as React from "react"

import { EmptyState } from "@/modules/shared/components/ui/empty-state"

interface LibraryTabStateProps {
  hasData: boolean
  emptyIcon: React.ReactNode
  emptyTitle: string
  emptyMessage: string
  children: React.ReactNode
}

export function LibraryTabState({
  hasData,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  children,
}: LibraryTabStateProps) {
  if (!hasData) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />
  }

  return <>{children}</>
}
