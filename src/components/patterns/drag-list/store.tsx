import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react"
import { useSharedValue, type SharedValue } from "react-native-reanimated"

export const INACTIVE = -1

export interface DragListStore {
  pan: SharedValue<number>
  activeIndex: SharedValue<number>
  shifted: SharedValue<number>
  autoScrollDirection: SharedValue<number>
  autoScrollAmount: SharedValue<number>
  scrollPosition: SharedValue<number>
  listHeight: SharedValue<number>
  itemSize: number
  dataLength: number
  reactiveActiveIndex: number
  setReactiveActiveIndex: (index: number) => void
  onDragBegin: () => void
}

const DragListContext = createContext<DragListStore | null>(null)

interface DragListStoreProviderProps {
  itemSize: number
  dataLength: number
  onDragBegin?: () => void
  children: ReactNode
}

export function DragListStoreProvider({
  itemSize,
  dataLength,
  onDragBegin,
  children,
}: DragListStoreProviderProps) {
  const onDragBeginRef = useRef(onDragBegin)
  onDragBeginRef.current = onDragBegin
  const pan = useSharedValue(0)
  const activeIndex = useSharedValue(INACTIVE)
  const shifted = useSharedValue(0)
  const autoScrollDirection = useSharedValue(0)
  const autoScrollAmount = useSharedValue(0)
  const scrollPosition = useSharedValue(0)
  const listHeight = useSharedValue(-1)
  const [reactiveActiveIndex, setReactiveActiveIndex] = useState(INACTIVE)

  // Shared values are stable for the provider's lifetime; only mirror the reactive index.
  const store = useMemo<DragListStore>(
    () => ({
      pan,
      activeIndex,
      shifted,
      autoScrollDirection,
      autoScrollAmount,
      scrollPosition,
      listHeight,
      itemSize,
      dataLength,
      reactiveActiveIndex,
      setReactiveActiveIndex,
      onDragBegin: () => onDragBeginRef.current?.(),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values are stable refs
    [itemSize, dataLength, reactiveActiveIndex]
  )

  return <DragListContext.Provider value={store}>{children}</DragListContext.Provider>
}

export function useDragListStore(): DragListStore {
  const store = useContext(DragListContext)
  if (!store) {
    throw new Error("DragList hooks must be used inside <DragList>")
  }
  return store
}
