import type { ReactNode } from "react"
import { View } from "react-native"
import { cn } from "tailwind-variants"

import { SCREEN_SECTION_GAP } from "@/lib/layout"
import { EmptyState, type EmptyStateConfig } from "@/components/ui/empty-state"
import { SectionHeader } from "@/components/ui/section-header"

interface ContentSectionProps<T> {
  title: string
  onViewMore?: () => void
  data: T[]
  renderContent: (data: T[]) => ReactNode
  emptyState: EmptyStateConfig
  className?: string
}

export function ContentSection<T>({
  title,
  onViewMore,
  data,
  renderContent,
  emptyState,
  className,
}: ContentSectionProps<T>) {
  return (
    <View className={className} style={{ marginBottom: SCREEN_SECTION_GAP }}>
      <SectionHeader
        title={title}
        onViewMore={data.length > 0 ? onViewMore : undefined}
        className="px-4"
      />
      {data.length > 0 ? (
        renderContent(data)
      ) : (
        <EmptyState icon={emptyState.icon} title={emptyState.title} message={emptyState.message} className="px-4 py-8" />
      )}
    </View>
  )
}
