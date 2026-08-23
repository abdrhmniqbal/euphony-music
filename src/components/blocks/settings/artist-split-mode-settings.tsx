import { ListGroup, Separator } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalTick02Icon from "@/components/icons/local/tick-02"
import { rebuildSplitRelationsForConfig } from "@/domains/indexer/service"
import { preferenceStore, usePreferenceStore } from "@/core/preferences/store"
import type { ArtistSplitMode } from "@/core/preferences/types"
import { useThemeColors } from "@/core/theme/use-theme-colors"

const SPLIT_MODE_OPTIONS = [
  {
    value: "split" as ArtistSplitMode,
    titleKey: "settings.library.artistSplitModeSplit",
    descriptionKey: "settings.library.artistSplitModeSplitDescription",
  },
  {
    value: "original" as ArtistSplitMode,
    titleKey: "settings.library.artistSplitModeOriginal",
    descriptionKey: "settings.library.artistSplitModeOriginalDescription",
  },
]

export function ArtistSplitModeSettings() {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const config = usePreferenceStore((state) => state.splitMultipleValueConfig)

  async function handleSelect(mode: ArtistSplitMode) {
    const updated = { ...config, artistSplitMode: mode }
    preferenceStore.setState({ splitMultipleValueConfig: updated })
    await rebuildSplitRelationsForConfig(updated)
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <ListGroup>
          {SPLIT_MODE_OPTIONS.map((option, index) => (
            <React.Fragment key={option.value}>
              {index > 0 && <Separator className="mx-4" />}
              <ListGroup.Item
                onPress={() => {
                  void handleSelect(option.value)
                }}
              >
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t(option.titleKey)}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>{t(option.descriptionKey)}</ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                {config.artistSplitMode === option.value ? (
                  <ListGroup.ItemSuffix>
                    <LocalTick02Icon fill="none" width={24} height={24} color={theme.accent} />
                  </ListGroup.ItemSuffix>
                ) : null}
              </ListGroup.Item>
            </React.Fragment>
          ))}
        </ListGroup>
      </View>
    </ScrollView>
  )
}
