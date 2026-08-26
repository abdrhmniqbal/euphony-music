import { Input, useBottomSheetAwareHandlers } from "heroui-native"
import type { ComponentProps } from "react"

type SheetInputProps = Omit<ComponentProps<typeof Input>, "onFocus" | "onBlur">

function SheetInput(props: SheetInputProps) {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers()

  return <Input {...props} onFocus={onFocus} onBlur={onBlur} />
}

export { SheetInput }
