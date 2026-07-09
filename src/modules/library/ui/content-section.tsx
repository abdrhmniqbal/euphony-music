/**
 * Purpose: Composes reusable content sections with a heading, optional empty state, and custom body renderer.
 * Caller: Home, Search, and genre route screens.
 * Dependencies: SectionHeader, EmptyState, tailwind-variants class merging.
 * Main Functions: ContentSection()
 * Side Effects: None.
 */

import type { ReactNode } from "react"
import { View } from "react-native"
import { cn } from "tailwind-variants"

import { SCREEN_SECTION_GAP } from "@/modules/shared/constants/layout"
import { EmptyState } from "@/modules/shared/components/ui/empty-state"
import { SectionHeader } from "@/modules/shared/components/ui/section-header"

import type { EmptyStateConfig } from "@/modules/shared/components/ui/empty-state"

interface ContentSectionProps<T> {
  title: string
  onViewMore?: () => void
  data: T[]
  renderContent: (data: T[]) => ReactNode
  emptyState: EmptyStateConfig
  className?: string
  titleClassName?: string
}

export function ContentSection<T>({
  title,
  onViewMore,
  data,
  renderContent,
  emptyState,
  className,
  titleClassName,
}: ContentSectionProps<T>) {
  return (
    <View className={className} style={{ marginBottom: SCREEN_SECTION_GAP }}>
      <SectionHeader
        title={title}
        onViewMore={data.length > 0 ? onViewMore : undefined}
        className={cn("px-4", titleClassName)}
      />
      {data.length > 0 ? (
        renderContent(data)
      ) : (
        <EmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          message={emptyState.message}
          className="px-4 py-8"
        />
      )}
    </View>
  )
}
