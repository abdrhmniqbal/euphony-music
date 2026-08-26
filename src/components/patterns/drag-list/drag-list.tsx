import type { LegendListProps, LegendListRenderItemProps } from "@legendapp/list/react-native"
import { AnimatedLegendList } from "@legendapp/list/reanimated"
import React, { useCallback } from "react"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import {
  clamp,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  withDelay,
  withTiming,
  type ReanimatedEvent,
} from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"

import { ItemWrapper } from "./item-wrapper"
import { DragListStoreProvider, INACTIVE, useDragListStore } from "./store"

type ListPassThroughProps<T> = Pick<
  LegendListProps<T>,
  | "style"
  | "contentContainerStyle"
  | "ListHeaderComponent"
  | "ListEmptyComponent"
  | "keyboardShouldPersistTaps"
  | "initialScrollIndex"
  | "scrollEnabled"
  | "showsVerticalScrollIndicator"
>

export interface DragListProps<T> extends ListPassThroughProps<T> {
  data: T[]
  keyExtractor: (item: T, index: number) => string
  renderItem: (info: { item: T; index: number }) => React.ReactNode
  /** Uniform height of every row, including any content gap. */
  estimatedItemSize: number
  onDragBegin?: () => void
  /** Called after the dragged item is dropped. */
  onDragEnd?: () => void
  onReordered: (from: number, to: number) => void
}

export function DragList<T>(props: DragListProps<T>) {
  return (
    <DragListStoreProvider
      itemSize={props.estimatedItemSize}
      dataLength={props.data.length}
      onDragBegin={props.onDragBegin}
    >
      <DragListImpl {...props} />
    </DragListStoreProvider>
  )
}

function DragListImpl<T>({
  data,
  keyExtractor,
  renderItem,
  estimatedItemSize,
  onReordered,
  onDragEnd,
  ...passThrough
}: DragListProps<T>) {
  const store = useDragListStore()
  const { pan, activeIndex, shifted, autoScrollDirection, autoScrollAmount, scrollPosition, listHeight } = store

  const listRef = useAnimatedRef()
  const dataLength = data.length

  const revalidateShifted = () => {
    "worklet"
    shifted.set(
      clamp(
        Math.round(pan.get() / estimatedItemSize),
        -activeIndex.get(),
        Math.max(0, dataLength - 1 - activeIndex.get())
      )
    )
  }

  const handleOnScroll = (e: ReanimatedEvent<{ contentOffset: { y: number } }>) => {
    "worklet"
    const offset = e.contentOffset.y
    if (activeIndex.get() === INACTIVE) {
      scrollPosition.set(offset)
      return
    }
    const delta = offset - scrollPosition.get()
    scrollPosition.set(offset)
    autoScrollAmount.set((prev) => prev + delta)
    pan.set(pan.get() + delta)
    revalidateShifted()
  }
  const scrollHandler = useAnimatedScrollHandler(handleOnScroll)

  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown((_event, stateManager) => {
      if (activeIndex.get() !== INACTIVE) stateManager.activate()
      else stateManager.fail()
    })
    .onUpdate(({ translationY, y }) => {
      autoScrollDirection.set(0)
      if (activeIndex.get() === INACTIVE) return
      pan.set(autoScrollAmount.get() + translationY)
      revalidateShifted()

      let direction = 0
      if (y < estimatedItemSize) direction = -1
      else if (y > listHeight.get() - estimatedItemSize) direction = 1
      autoScrollDirection.set(direction)
    })
    .onFinalize(() => {
      autoScrollDirection.set(0)
      if (activeIndex.get() !== INACTIVE) {
        scheduleOnRN(handleDrop, activeIndex.get(), activeIndex.get() + shifted.get())
      }
      scheduleOnRN(cleanup)
    })

  useAnimatedReaction(
    () => autoScrollDirection.get(),
    (direction) => {
      if (direction === 0) return
      scrollTo(listRef, 0, scrollPosition.get() + estimatedItemSize * direction, true)
      // Reset to `0` to prevent excessive re-fires, then re-fire with growing speed.
      autoScrollDirection.set(0)
      autoScrollDirection.set(
        withDelay(
          250,
          withTiming(0, { duration: 0 }, (finished) => {
            if (finished) autoScrollDirection.set(clamp(direction * 1.25, -2.5, 2.5))
          })
        )
      )
    },
    [estimatedItemSize]
  )

  const handleDrop = useCallback(
    (from: number, to: number) => {
      onDragEnd?.()
      if (from !== to) onReordered(from, to)
    },
    [onDragEnd, onReordered]
  )

  const cleanup = useCallback(() => {
    store.setReactiveActiveIndex(INACTIVE)
    activeIndex.set(INACTIVE)
    autoScrollDirection.set(0)
    autoScrollAmount.set(0)
    pan.set(0)
    shifted.set(0)
  }, [store, activeIndex, autoScrollDirection, autoScrollAmount, pan, shifted])

  const renderDragItem = useCallback(
    ({ item, index }: LegendListRenderItemProps<T>) => (
      <ItemWrapper index={index}>{renderItem({ item, index })}</ItemWrapper>
    ),
    [renderItem]
  )

  const isDragging = store.reactiveActiveIndex !== INACTIVE

  return (
    <GestureDetector gesture={Gesture.Simultaneous(Gesture.Native(), panGesture)}>
      <AnimatedLegendList
        {...passThrough}
        // SAFETY: useAnimatedRef targets the underlying scroll view; scrollTo only needs that handle.
        ref={listRef as never}
        onLayout={(e) => listHeight.set(e.nativeEvent.layout.height)}
        estimatedItemSize={estimatedItemSize}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderDragItem}
        onScroll={scrollHandler}
        scrollEnabled={!isDragging && passThrough.scrollEnabled !== false}
        keyboardShouldPersistTaps={passThrough.keyboardShouldPersistTaps}
        maintainVisibleContentPosition={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        bounces={false}
      />
    </GestureDetector>
  )
}

export function useDragStart(): (index: number) => void {
  const { pan, activeIndex, shifted, reactiveActiveIndex, setReactiveActiveIndex, onDragBegin } =
    useDragListStore()

  return React.useCallback(
    (index: number) => {
      if (reactiveActiveIndex !== INACTIVE || activeIndex.get() !== INACTIVE) return
      activeIndex.set(index)
      pan.set(0)
      shifted.set(0)
      setReactiveActiveIndex(index)
      onDragBegin()
    },
    [activeIndex, pan, shifted, reactiveActiveIndex, setReactiveActiveIndex, onDragBegin]
  )
}

export function useIsDraggingItem(index: number): boolean {
  const { reactiveActiveIndex } = useDragListStore()
  return reactiveActiveIndex === index
}
