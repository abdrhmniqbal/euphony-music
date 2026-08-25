import { useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalTick02Icon from "@/components/icons/local/tick-02"
import { ActionSheet } from "@/components/ui/action-sheet"
import { MenuRow } from "@/components/ui/menu-row"
import { preferenceStore, usePreferenceStore } from "@/core/preferences/store"
import { useThemeColor } from "heroui-native"
import { showAppToast } from "@/core/ui/toast"
import { forceUpdateMixes } from "@/domains/mixes/repository"
import { mixKeys } from "@/domains/mixes/queries"

const MAX_ITEMS_OPTIONS = [10, 15, 20, 25, 30, 50]

interface MixMaxItemsSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function MixMaxItemsSheet({ isOpen, onOpenChange }: MixMaxItemsSheetProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const accent = useThemeColor("accent")
  const maxMixItems = usePreferenceStore((state) => state.maxMixItems)

  function handleSelect(value: number) {
    preferenceStore.setState({ maxMixItems: value })
    onOpenChange(false)

    void forceUpdateMixes()
      .then(async () => {
        await queryClient.invalidateQueries({ queryKey: mixKeys.all })
        showAppToast(
          t("settings.advanced.mixesUpdatedTitle"),
          t("settings.advanced.mixesUpdatedDescription")
        )
      })
      .catch(() => {
        showAppToast(t("settings.advanced.mixesUnableTitle"), t("settings.advanced.tryAgainDescription"))
      })
  }

  return (
    <ActionSheet.Root isOpen={isOpen} onOpenChange={onOpenChange}>
      <ActionSheet.Content contentContainerClassName="px-5 pb-6">
        <Text className="mb-3 mt-2 text-xl font-bold text-foreground">
          {t("mix.maxItemsTitle")}
        </Text>
        <View className="gap-1 pb-2">
          {MAX_ITEMS_OPTIONS.map((value) => {
            const isSelected = value === maxMixItems
            return (
              <MenuRow
                key={value}
                icon={
                  isSelected ? (
                    <LocalTick02Icon fill="none" width={20} height={20} color={accent} />
                  ) : (
                    <View className="h-5 w-5" />
                  )
                }
                label={t("library.count.track", { count: value })}
                onPress={() => handleSelect(value)}
              />
            )
          })}
        </View>
      </ActionSheet.Content>
    </ActionSheet.Root>
  )
}
