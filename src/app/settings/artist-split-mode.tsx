/**
 * Purpose: Renders artist split mode selection (split vs original string display).
 * Caller: Settings artist-split-mode route.
 * Dependencies: HeroUI Native ListGroup, react-i18next, split-multiple-values module, indexer relation rebuild, theme colors.
 * Main Functions: ArtistSplitModeScreen()
 * Side Effects: Persists artist split mode and rebuilds split metadata relations.
 */

import { ListGroup, Separator } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalTickIcon from "@/components/icons/local/tick"
import { rebuildSplitRelationsForConfig } from "@/modules/indexer/service"
import { setSplitMultipleValueConfig } from "@/modules/settings/split-multiple-values"
import { useSettingsStore } from "@/modules/settings/store"
import { useThemeColors } from "@/modules/ui/theme"

type SplitMode = "original" | "split"

const SPLIT_MODE_OPTIONS = [
  {
    value: "split" as SplitMode,
    titleKey: "settings.library.artistSplitModeSplit",
    descriptionKey: "settings.library.artistSplitModeSplitDescription",
  },
  {
    value: "original" as SplitMode,
    titleKey: "settings.library.artistSplitModeOriginal",
    descriptionKey: "settings.library.artistSplitModeOriginalDescription",
  },
] as const

export default function ArtistSplitModeScreen() {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const config = useSettingsStore((state) => state.splitMultipleValueConfig)

  async function handleSelect(mode: SplitMode) {
    const updated = await setSplitMultipleValueConfig({ artistSplitMode: mode })
    await rebuildSplitRelationsForConfig(updated)
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
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
                  <ListGroup.ItemDescription>
                    {t(option.descriptionKey)}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                {config.artistSplitMode === option.value ? (
                  <ListGroup.ItemSuffix>
                    <LocalTickIcon
                      fill="none"
                      width={24}
                      height={24}
                      color={theme.accent}
                    />
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
