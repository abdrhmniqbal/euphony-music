/**
 * Purpose: Renders horizontal media carousels with virtualization fallback and remount control for playback state updates.
 * Caller: Home and search content sections, ranked lists, and other horizontal previews.
 * Dependencies: LegendList virtualization, ScrollView fallback, EmptyState, tailwind class merging.
 * Main Functions: MediaCarousel()
 * Side Effects: None.
 */

import type { ReactNode } from "react"
import { LegendList, type LegendListRenderItemProps } from "@legendapp/list/react-native"
import { ScrollView, type StyleProp, View, type ViewStyle } from "react-native"
import { cn } from "tailwind-variants"

import { EmptyState } from "@/modules/shared/components/ui/empty-state"

import type { EmptyStateConfig } from "@/modules/shared/components/ui/empty-state"

interface MediaCarouselProps<T> {
  data: T[]
  renderItem: (item: T, index: number) => ReactNode
  keyExtractor: (item: T, index: number) => string
  emptyState?: EmptyStateConfig
  gap?: number
  paddingHorizontal?: number
  virtualizationThreshold?: number
  className?: string
  contentContainerStyle?: StyleProp<ViewStyle>
  dataVersionKey?: string
}

export function MediaCarousel<T>({
  data,
  renderItem,
  keyExtractor,
  emptyState,
  gap = 16,
  paddingHorizontal = 16,
  virtualizationThreshold = 8,
  className,
  contentContainerStyle,
  dataVersionKey,
}: MediaCarouselProps<T>) {
  const shouldVirtualize = data.length >= virtualizationThreshold

  if (data.length === 0 && emptyState) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        message={emptyState.message}
        className={cn("mb-8 py-8", className)}
      />
    )
  }

  if (shouldVirtualize) {
    return (
      <LegendList
        key={dataVersionKey}
        horizontal
        data={data}
        maintainVisibleContentPosition={false}
        dataVersion={dataVersionKey}
        keyExtractor={keyExtractor}
        renderItem={({ item, index }: LegendListRenderItemProps<T>) => (
          <View style={{ marginRight: index === data.length - 1 ? 0 : gap }}>
            {renderItem(item, index)}
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[{ paddingHorizontal }, contentContainerStyle]}
        className={cn("mb-8", className)}
        estimatedItemSize={220}
        recycleItems
      />
    )
  }

  return (
    <ScrollView
      key={dataVersionKey}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[{ paddingHorizontal, gap }, contentContainerStyle]}
      className={cn("mb-8", className)}
    >
      {data.map((item, index) => (
        <View key={keyExtractor(item, index)}>{renderItem(item, index)}</View>
      ))}
    </ScrollView>
  )
}
