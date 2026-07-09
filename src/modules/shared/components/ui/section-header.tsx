/**
 * Purpose: Renders section headings with optional supporting copy and a compact trailing action.
 * Caller: Content sections across Home, Search, Library, and detail routes.
 * Dependencies: HeroUI Native button, local chevron icon, theme colors.
 * Main Functions: SectionHeader()
 * Side Effects: Triggers route navigation or inline actions through the optional view-more control.
 */

import { Button } from "heroui-native"
import { Text, View } from "react-native"
import { cn } from "tailwind-variants"

import { useThemeColors } from "@/modules/ui/theme"

import LocalChevronRightIcon from "@/modules/shared/components/icons/local/chevron-right"

interface SectionHeaderProps {
  title: string
  className?: string
  onViewMore?: () => void
}

export function SectionHeader({ title, className, onViewMore }: SectionHeaderProps) {
  const theme = useThemeColors()

  return (
    <View className={cn("mb-5", className)}>
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-[22px] font-semibold tracking-[-0.6px] text-foreground">
          {title}
        </Text>
        {onViewMore ? (
          <Button
            onPress={onViewMore}
            hitSlop={20}
            variant="ghost"
            className="h-9 w-9 rounded-full border border-border/70 bg-default/55"
            isIconOnly
          >
            <LocalChevronRightIcon fill="none" width={20} height={20} color={theme.muted} />
          </Button>
        ) : null}
      </View>
    </View>
  )
}
