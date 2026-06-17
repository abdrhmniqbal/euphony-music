/**
 * Purpose: Renders tappable settings rows with optional descriptions and trailing controls.
 * Caller: Settings index and all settings detail routes.
 * Dependencies: HeroUI Native press feedback, local chevron icon, theme colors.
 * Main Functions: SettingsRow()
 * Side Effects: Triggers navigation or inline setting changes through parent callbacks.
 */

import { PressableFeedback } from "heroui-native"
import type { ReactNode } from "react"
import { Text, View } from "react-native"
import { cn } from "tailwind-variants"

import LocalChevronRightIcon from "@/components/icons/local/chevron-right"
import { useThemeColors } from "@/modules/ui/theme"

interface SettingsRowProps {
  title: string
  description?: string
  onPress?: () => void
  rightContent?: ReactNode
  showChevron?: boolean
  isDisabled?: boolean
  className?: string
}

export function SettingsRow({
  title,
  description,
  onPress,
  rightContent,
  showChevron = true,
  isDisabled = false,
  className,
}: SettingsRowProps) {
  const theme = useThemeColors()

  return (
    <PressableFeedback
      onPress={isDisabled ? undefined : onPress}
      className={cn(
        "min-h-[76px] flex-row items-center gap-4 bg-background px-5 py-4",
        isDisabled ? "opacity-60" : "active:opacity-75",
        className
      )}
    >
      <View className="flex-1 gap-1">
        <Text className="text-[16px] font-medium tracking-[-0.1px] text-foreground">{title}</Text>
        {description ? (
          <Text className="text-[13px] leading-5 text-muted">{description}</Text>
        ) : null}
      </View>
      <View className="flex-row items-center gap-2">
        {rightContent}
        {showChevron ? (
          <LocalChevronRightIcon fill="none" width={20} height={20} color={theme.muted} />
        ) : null}
      </View>
    </PressableFeedback>
  )
}
