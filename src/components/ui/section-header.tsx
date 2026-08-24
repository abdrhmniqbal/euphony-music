import { Button, useThemeColor } from "heroui-native"
import { Text, View } from "react-native"
import { cn } from "tailwind-variants"

import LocalChevronRightIcon from "@/components/icons/local/chevron-right"

interface SectionHeaderProps {
  title: string
  className?: string
  onViewMore?: () => void
}

export function SectionHeader({ title, className, onViewMore }: SectionHeaderProps) {
  const muted = useThemeColor("muted")
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
            <LocalChevronRightIcon fill="none" width={20} height={20} color={muted} />
          </Button>
        ) : null}
      </View>
    </View>
  )
}
