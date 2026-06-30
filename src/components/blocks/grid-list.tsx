import { LegendList } from "@legendapp/list/react-native"
import * as React from "react"
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native"
import { useActionSheet } from "@/components/blocks/use-action-sheet"
import { LEGEND_LIST_GRID_CONFIG } from "@/components/blocks/legend-list-config"
import { useLegendListBehavior } from "@/components/blocks/use-legend-list-behavior"
import { EmptyState } from "@/components/ui/empty-state"

interface GridListEmptyState {
  icon: React.ReactNode
  title: string
  message: string
}

interface GridListProps<T> {
  data: T[]
  renderItem: (
    item: T,
    helpers: { onLongPress: () => void; itemWidth: number; index: number; column: number }
  ) => React.ReactNode
  keyExtractor: (item: T) => string
  numColumns: number
  gap: number
  horizontalPadding?: number
  estimatedItemHeight: number | ((itemWidth: number) => number)
  emptyState: GridListEmptyState
  renderSheet: (selected: T, closeSheet: () => void, isOpen: boolean) => React.ReactNode
  containerClassName?: string
  scrollEnabled?: boolean
  listHeader?: React.ReactElement | null
  listFooter?: React.ReactElement | null
  contentContainerStyle?: StyleProp<ViewStyle>
  showsVerticalScrollIndicator?: boolean
  scrollEventThrottle?: number
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  refreshControl?: React.ReactElement<RefreshControlProps> | null
  resetScrollKey?: string
}

export function GridList<T>({
  data,
  renderItem,
  keyExtractor,
  numColumns,
  gap,
  horizontalPadding = 32,
  estimatedItemHeight,
  emptyState,
  renderSheet,
  containerClassName = "",
  scrollEnabled = true,
  listHeader = null,
  listFooter = null,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  scrollEventThrottle = 16,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
  refreshControl,
  resetScrollKey,
}: GridListProps<T>) {
  const {
    selected,
    isOpen: isSheetOpen,
    handleLongPress: setSelected,
    closeSheet,
  } = useActionSheet<T>()
  const { listRef, listBehaviorProps } = useLegendListBehavior(resetScrollKey)
  const { width: windowWidth } = useWindowDimensions()
  const itemWidth = (windowWidth - horizontalPadding - gap * (numColumns - 1)) / numColumns
  const estimatedSize =
    typeof estimatedItemHeight === "function" ? estimatedItemHeight(itemWidth) : estimatedItemHeight
  const gridContentContainerStyle = StyleSheet.flatten([
    { paddingBottom: 8 },
    contentContainerStyle,
  ])

  if (data.length === 0) {
    return (
      <EmptyState icon={emptyState.icon} title={emptyState.title} message={emptyState.message} />
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <LegendList
        ref={listRef}
        {...listBehaviorProps}
        data={data}
        renderItem={({ item, index }) => {
          const column = index % numColumns
          return renderItem(item, {
            onLongPress: () => setSelected(item),
            itemWidth,
            index,
            column,
          })
        }}
        keyExtractor={keyExtractor}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        numColumns={numColumns}
        contentContainerStyle={gridContentContainerStyle}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={scrollEventThrottle}
        refreshControl={refreshControl || undefined}
        style={{ flex: 1, minHeight: 1 }}
        className={containerClassName}
        {...LEGEND_LIST_GRID_CONFIG}
        estimatedItemSize={estimatedSize}
      />
      {renderSheet(selected, closeSheet, isSheetOpen)}
    </View>
  )
}
