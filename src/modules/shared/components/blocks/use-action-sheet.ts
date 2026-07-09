import { useCallback, useState } from "react"

interface UseActionSheetReturn<T> {
  selected: T | null
  setSelected: (item: T | null) => void
  isOpen: boolean
  handleLongPress: (item: T) => void
  closeSheet: () => void
}

export function useActionSheet<T>(): UseActionSheetReturn<T> {
  const [selected, setSelected] = useState<T | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleLongPress = useCallback((item: T) => {
    setSelected(item)
    setIsOpen(true)
  }, [])

  const closeSheet = useCallback(() => {
    setIsOpen(false)
  }, [])

  return { selected, setSelected, isOpen, handleLongPress, closeSheet }
}
