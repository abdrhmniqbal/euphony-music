import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"
import { cn } from "tailwind-variants"

import { SortSheet } from "@/components/blocks/sort-sheet"

interface LibraryListHeaderProps {
  count: number
  sortLabel: string
  className?: string
}

export function LibraryListHeader({ count, sortLabel, className }: LibraryListHeaderProps) {
  const { t } = useTranslation()

  return (
    <View className={cn("mb-4 flex-row items-center justify-between", className)}>
      <Text className="text-lg font-bold text-foreground">
        {t("library.count.item", { count })}
      </Text>
      <SortSheet.Trigger label={sortLabel} iconSize={14} />
    </View>
  )
}
