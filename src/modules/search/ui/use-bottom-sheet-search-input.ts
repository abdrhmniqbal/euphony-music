/**
 * Purpose: Provides keyboard-aware focus/blur handlers for TextInput inside gorhom BottomSheet.
 * Caller: SheetSearchInput, PlaylistPickerSearchInput, and any other bottom-sheet search inputs.
 * Dependencies: @gorhom/bottom-sheet useBottomSheetInternal.
 */

import { useBottomSheetInternal } from "@gorhom/bottom-sheet"
import { useCallback, useRef } from "react"
import { type BlurEvent, findNodeHandle, type FocusEvent, TextInput } from "react-native"

export function useBottomSheetSearchInput() {
  const { animatedKeyboardState, textInputNodesRef } = useBottomSheetInternal()
  const inputRef = useRef<TextInput>(null)

  const handleOnFocus = useCallback(
    (e: FocusEvent) => {
      animatedKeyboardState.set((state) => ({
        ...state,
        target: e.nativeEvent.target,
      }))
    },
    [animatedKeyboardState]
  )

  const handleOnBlur = useCallback(
    (e: BlurEvent) => {
      const keyboardState = animatedKeyboardState.get()
      const currentFocusedInput = findNodeHandle(
        TextInput.State.currentlyFocusedInput() as TextInput | null
      )
      const shouldRemoveCurrentTarget = keyboardState.target === e.nativeEvent.target
      const shouldIgnoreBlurEvent =
        currentFocusedInput && textInputNodesRef.current.has(currentFocusedInput)

      if (shouldRemoveCurrentTarget && !shouldIgnoreBlurEvent) {
        animatedKeyboardState.set((state) => ({
          ...state,
          target: undefined,
        }))
      }
    },
    [animatedKeyboardState, textInputNodesRef]
  )

  return { inputRef, handleOnFocus, handleOnBlur }
}
