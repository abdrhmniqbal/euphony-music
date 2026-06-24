import { BottomSheetTextInput } from "@gorhom/bottom-sheet"
import { forwardRef } from "react"
import { type TextInput as TextInputType, type TextInputProps } from "react-native"

export interface BottomSheetInputProps extends TextInputProps {
  className?: string
  variant?: "primary" | "secondary"
  isInvalid?: boolean
  isDisabled?: boolean
}

export const BottomSheetInput = forwardRef<TextInputType, BottomSheetInputProps>((props, ref) => {
  const {
    variant = "secondary",
    isInvalid = false,
    isDisabled = false,
    className = "",
    style,
    ...restProps
  } = props

  // Replicate input classNames from heroui-native
  const baseClass =
    "min-h-12 px-3 rounded-2xl text-foreground font-normal border-[1.5px] focus:border-accent"
  const variantClass =
    variant === "primary"
      ? "bg-field border-field-border ios:shadow-field android:shadow-sm"
      : "bg-default border-default"

  const invalidClass = isInvalid ? "border-danger focus:border-danger" : ""
  const disabledClass = isDisabled ? "opacity-50" : ""

  const combinedClassName =
    `${baseClass} ${variantClass} ${invalidClass} ${disabledClass} ${className}`.trim()

  return (
    <BottomSheetTextInput
      ref={ref as any}
      className={combinedClassName}
      style={[{ borderCurve: "continuous" } as any, style]}
      editable={!isDisabled}
      placeholderTextColor="hsl(var(--muted))"
      {...restProps}
    />
  )
})

BottomSheetInput.displayName = "BottomSheetInput"
