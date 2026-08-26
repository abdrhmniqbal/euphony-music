import { Button, Dialog, ListGroup, Slider } from "heroui-native"
import { Switch } from "@/components/ui/switch"
import * as React from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import {
  SettingsListGroup,
  SettingsNavigationRow,
  SettingsScrollView,
} from "@/components/blocks/settings/ui"
import { showAppToast } from "@/core/ui/toast"
import { preferenceStore, usePreferenceStore } from "@/core/preferences/store"
import type { IndexerScanConfig, TrackDurationFilterConfig } from "@/core/preferences/types"
import { useGuardedRouter } from "@/core/navigation"
import { forceReindexLibrary } from "@/domains/indexer/service"
import { useIndexerStore } from "@/domains/indexer/progress/store"

function getSliderNumericValue(value: number | number[]): number {
  return Array.isArray(value) ? (value[0] ?? 0) : value
}

function getTrackDurationFilterLabel(
  config: TrackDurationFilterConfig,
  t: (key: string, opts?: Record<string, string | number>) => string
): string {
  switch (config.mode) {
    case "off":
      return t("settings.trackDuration.noFilter")
    case "min30s":
      return t("settings.trackDuration.min30")
    case "min60s":
      return t("settings.trackDuration.min60")
    case "min120s":
      return t("settings.trackDuration.min120")
    case "custom": {
      const minutes = Math.floor(config.customMinimumSeconds / 60)
      const seconds = config.customMinimumSeconds % 60
      return t("settings.trackDuration.customValue", { value: `${minutes}m ${seconds}s` })
    }
  }
}

export function LibrarySettings() {
  const router = useGuardedRouter()
  const { t } = useTranslation()
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const indexerScanConfig = usePreferenceStore((state) => state.indexerScanConfig)
  const countAsPlayedConfig = usePreferenceStore((state) => state.countAsPlayedConfig)
  const trackDurationFilterConfig = usePreferenceStore((state) => state.trackDurationFilterConfig)
  const [showReindexDialog, setShowReindexDialog] = React.useState(false)
  const [countAsPlayedSliderValue, setCountAsPlayedSliderValue] = React.useState<number | null>(
    null
  )
  const resolvedCountAsPlayedPercent =
    countAsPlayedSliderValue ?? countAsPlayedConfig.minimumPlayedPercent

  function updateIndexerScanConfig(key: keyof IndexerScanConfig, value: boolean) {
    preferenceStore.setState({
      indexerScanConfig: { ...indexerScanConfig, [key]: value },
    })
  }

  async function handleCountAsPlayedChangeEnd(value: number) {
    preferenceStore.setState({
      countAsPlayedConfig: { ...countAsPlayedConfig, minimumPlayedPercent: value },
    })
    setCountAsPlayedSliderValue(null)
    showAppToast(
      t("settings.library.countAsPlayed"),
      t("settings.library.countAsPlayedValue", { value })
    )
  }

  function handleConfirmForceReindex() {
    setShowReindexDialog(false)
    showAppToast(t("settings.library.reindexLibrary"), t("common.feedback.libraryReindexStarted"))
    void forceReindexLibrary(true)
  }

  return (
    <>
      <SettingsScrollView>
        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase text-muted">
            {t("settings.library.sections.content")}
          </Text>
          <SettingsListGroup>
            <SettingsNavigationRow
              title={t("settings.routes.folderFilters.title")}
              description={t("settings.library.folderFiltersDescription")}
              onPress={() => router.push("/settings/folder-filters")}
            />
            <SettingsNavigationRow
              title={t("settings.routes.trackDurationFilter.title")}
              description={getTrackDurationFilterLabel(trackDurationFilterConfig, t)}
              onPress={() => router.push("/settings/track-duration-filter")}
            />
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
          </SettingsListGroup>
        </View>

        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase text-muted">
            {t("settings.library.sections.interface")}
          </Text>
          <SettingsListGroup>
            <SettingsNavigationRow
              title={t("settings.library.splitMultipleValues")}
              description={t("settings.library.artistCharDelimitersDescription")}
              onPress={() => router.push("/settings/split-multiple-values")}
            />
            <SettingsNavigationRow
              title={t("settings.routes.libraryTabs.title")}
              description={t("settings.library.libraryTabsDescription")}
              onPress={() => router.push("/settings/library-tabs")}
            />
          </SettingsListGroup>
        </View>

        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase text-muted">
            {t("settings.library.sections.indexing")}
          </Text>
          <SettingsListGroup>
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
                  onSelectedChange={(isSelected) =>
                    updateIndexerScanConfig("autoScanEnabled", isSelected)
                  }
                />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
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
                  onSelectedChange={(isSelected) =>
                    updateIndexerScanConfig("initialScanEnabled", isSelected)
                  }
                />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
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
                  onSelectedChange={(isSelected) =>
                    updateIndexerScanConfig("rescanImmediatelyEnabled", isSelected)
                  }
                />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
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
          </SettingsListGroup>
        </View>
      </SettingsScrollView>

      <Dialog isOpen={showReindexDialog} onOpenChange={setShowReindexDialog}>
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
              <Button variant="ghost" onPress={() => setShowReindexDialog(false)}>
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
