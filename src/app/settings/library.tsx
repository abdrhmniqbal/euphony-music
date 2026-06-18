/**
 * Purpose: Renders library settings for indexer scan behavior, playback counting preferences, split metadata preferences, folder and duration filters, and reindexing.
 * Caller: Settings library route.
 * Dependencies: Expo Router, react-i18next, settings store, indexer services, HeroUI Native ListGroup, dialog, slider, and switch.
 * Main Functions: LibrarySettingsScreen()
 * Side Effects: Persists library settings, shows a manual reindex dialog, and can trigger a full library reindex.
 */

import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { Button, Dialog, ListGroup, Separator, Slider, Switch } from "heroui-native"
import * as React from "react"
import { ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import { forceReindexLibrary } from "@/modules/indexer/service"
import { useIndexerStore } from "@/modules/indexer/store"
import { setAutoScanConfig } from "@/modules/settings/auto-scan"
import { setCountAsPlayedConfig } from "@/modules/settings/count-as-played"
import type { IndexerScanConfig } from "@/modules/settings/types"
import { getTrackDurationFilterLabel } from "@/modules/settings/track-duration-filter"
import { useSettingsStore } from "@/modules/settings/store"
import { showAppToast } from "@/modules/ui/toast"

function getSliderNumericValue(value: number | number[]): number {
  return Array.isArray(value) ? (value[0] ?? 0) : value
}

export default function LibrarySettingsScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const indexerScanConfig = useSettingsStore((state) => state.indexerScanConfig)
  const countAsPlayedConfig = useSettingsStore((state) => state.countAsPlayedConfig)
  const trackDurationFilterConfig = useSettingsStore((state) => state.trackDurationFilterConfig)
  const splitMultipleValueConfig = useSettingsStore((state) => state.splitMultipleValueConfig)
  const [showReindexDialog, setShowReindexDialog] = React.useState(false)
  const [countAsPlayedSliderValue, setCountAsPlayedSliderValue] = React.useState<number | null>(
    null
  )
  const resolvedCountAsPlayedPercent =
    countAsPlayedSliderValue ?? countAsPlayedConfig.minimumPlayedPercent

  function getSplitMultipleValuesSummary() {
    const modeLabel =
      splitMultipleValueConfig.artistSplitMode === "original"
        ? t("settings.library.artistSplitModeOriginal")
        : t("settings.library.artistSplitModeSplit")

    return t("settings.library.splitMultipleValuesSummary", {
      mode: modeLabel,
      artistSymbols: splitMultipleValueConfig.artistSplitSymbols.join(" "),
      genreSymbols: splitMultipleValueConfig.genreSplitSymbols.join(" "),
    })
  }

  function handleReindexDialogOpenChange(isOpen: boolean) {
    setShowReindexDialog(isOpen)
  }

  function handleReindexLater() {
    setShowReindexDialog(false)
  }

  function handleConfirmForceReindex() {
    setShowReindexDialog(false)
    showAppToast(t("settings.library.reindexLibrary"), t("common.feedback.libraryReindexStarted"))
    void forceReindexLibrary(true)
  }

  function updateIndexerScanConfig(key: keyof IndexerScanConfig, value: boolean) {
    void setAutoScanConfig({
      [key]: value,
    } as Partial<IndexerScanConfig>)
  }

  async function handleCountAsPlayedChangeEnd(value: number) {
    await setCountAsPlayedConfig({
      minimumPlayedPercent: value,
    })
    setCountAsPlayedSliderValue(null)
    showAppToast(t("settings.library.countAsPlayed"), t("settings.library.countAsPlayedValue", { value }))
  }

  return (
    <>
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="gap-5 px-4 py-4">
          <ListGroup>
            <ListGroup.Item onPress={() => router.push("/settings/folder-filters")}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  {t("settings.routes.folderFilters.title")}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t("settings.library.folderFiltersDescription")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item onPress={() => router.push("/settings/track-duration-filter")}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  {t("settings.library.trackDurationFilter")}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {getTrackDurationFilterLabel(trackDurationFilterConfig)}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item onPress={() => router.push("/settings/split-multiple-values")}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  {t("settings.library.splitMultipleValues")}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t("settings.library.artistSplitSymbolsDescription")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item>
              <ListGroup.ItemContent>
                <View className="mb-3 flex-row items-center justify-between">
                  <ListGroup.ItemTitle>{t("settings.library.countAsPlayed")}</ListGroup.ItemTitle>
                  <Text className="text-sm font-medium text-foreground">
                    {t("settings.library.countAsPlayedValue", {
                      value: resolvedCountAsPlayedPercent,
                    })}
                  </Text>
                </View>
                <Slider
                  minValue={1}
                  maxValue={100}
                  step={1}
                  value={resolvedCountAsPlayedPercent}
                  onChange={(value) => {
                    setCountAsPlayedSliderValue(getSliderNumericValue(value))
                  }}
                  onChangeEnd={(value) => {
                    void handleCountAsPlayedChangeEnd(getSliderNumericValue(value))
                  }}
                >
                  <Slider.Track className="h-2 rounded-full bg-border">
                    <Slider.Fill className="rounded-full bg-accent" />
                    <Slider.Thumb />
                  </Slider.Track>
                </Slider>
                <Text className="mt-2 text-xs text-muted">
                  {t("settings.library.countAsPlayedDescription")}
                </Text>
              </ListGroup.ItemContent>
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t("settings.library.autoScan")}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t("settings.library.autoScanDescription")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Switch
                  isSelected={indexerScanConfig.autoScanEnabled}
                  onSelectedChange={(isSelected) => {
                    updateIndexerScanConfig("autoScanEnabled", isSelected)
                  }}
                />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t("settings.library.initialScan")}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t("settings.library.initialScanDescription")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Switch
                  isSelected={indexerScanConfig.initialScanEnabled}
                  onSelectedChange={(isSelected) => {
                    updateIndexerScanConfig("initialScanEnabled", isSelected)
                  }}
                />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t("settings.library.rescanImmediately")}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t("settings.library.rescanImmediatelyDescription")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Switch
                  isSelected={indexerScanConfig.rescanImmediatelyEnabled}
                  onSelectedChange={(isSelected) => {
                    updateIndexerScanConfig("rescanImmediatelyEnabled", isSelected)
                  }}
                />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item onPress={() => setShowReindexDialog(true)} disabled={isIndexing}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t("settings.library.reindexLibrary")}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {isIndexing
                    ? t("settings.library.reindexInProgress")
                    : t("settings.library.reindexDescription")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
            </ListGroup.Item>
          </ListGroup>
        </View>
      </ScrollView>

      <Dialog isOpen={showReindexDialog} onOpenChange={handleReindexDialogOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay isCloseOnPress />
          <Dialog.Content className="gap-4" isSwipeable>
            <View className="gap-1.5">
              <Dialog.Title>{t("settings.library.reindexDialogTitle")}</Dialog.Title>
              <Dialog.Description>
                {t("settings.library.reindexDialogDescription")}
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" onPress={handleReindexLater}>
                {t("settings.library.reindexLaterAction")}
              </Button>
              <Button onPress={handleConfirmForceReindex}>
                {t("settings.library.reindexAction")}
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
