import { ListGroup, Separator, Slider, useThemeColor } from "heroui-native"
import * as React from "react"
import { ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalTick02Icon from "@/components/icons/local/tick-02"
import { showAppToast } from "@/core/ui/toast"
import { preferenceStore, usePreferenceStore } from "@/core/preferences/store"
import type { TrackDurationFilterMode } from "@/core/preferences/types"
import { startIndexing } from "@/domains/indexer/service"
import { useIndexerStore } from "@/domains/indexer/progress/store"

const DURATION_OPTIONS: Array<{
  labelKey: string
  value: TrackDurationFilterMode
  descriptionKey?: string
}> = [
  {
    labelKey: "settings.trackDuration.noFilter",
    value: "off",
    descriptionKey: "settings.trackDuration.noFilterDescription",
  },
  {
    labelKey: "settings.trackDuration.min30",
    value: "min30s",
    descriptionKey: "settings.trackDuration.min30Description",
  },
  {
    labelKey: "settings.trackDuration.min60",
    value: "min60s",
    descriptionKey: "settings.trackDuration.min60Description",
  },
  {
    labelKey: "settings.trackDuration.min120",
    value: "min120s",
    descriptionKey: "settings.trackDuration.min120Description",
  },
  {
    labelKey: "settings.trackDuration.custom",
    value: "custom",
    descriptionKey: "settings.trackDuration.customDescription",
  },
]

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  if (total < 60) {
    return `${total}s`
  }

  const minutes = Math.floor(total / 60)
  const remainder = total % 60
  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`
}

function getSliderNumericValue(value: number | number[]): number {
  return Array.isArray(value) ? (value[0] ?? 0) : value
}

export function TrackDurationFilterSettings() {
  const accent = useThemeColor("accent")
  const { t } = useTranslation()
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const config = usePreferenceStore((state) => state.trackDurationFilterConfig)
  const [customSliderValue, setCustomSliderValue] = React.useState<number | null>(null)
  const resolvedCustomSliderValue = customSliderValue ?? config.customMinimumSeconds

  async function handleModeSelect(mode: TrackDurationFilterMode) {
    preferenceStore.setState({ trackDurationFilterConfig: { ...config, mode } })

    if (mode !== "custom") {
      setCustomSliderValue(null)
      showAppToast(
        t("settings.routes.trackDurationFilter.title"),
        t("common.feedback.trackDurationUpdated")
      )
      await startIndexing(false, true)
    }
  }

  async function handleCustomSlidingComplete(value: number) {
    preferenceStore.setState({
      trackDurationFilterConfig: { mode: "custom", customMinimumSeconds: value },
    })
    showAppToast(
      t("settings.routes.trackDurationFilter.title"),
      t("common.feedback.trackDurationUpdated")
    )
    await startIndexing(false, true)
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <ListGroup>
          {DURATION_OPTIONS.map((option, index) => (
            <React.Fragment key={option.value}>
              {index > 0 && <Separator className="mx-4" />}
              <ListGroup.Item
                onPress={() => {
                  void handleModeSelect(option.value)
                }}
                disabled={isIndexing}
              >
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t(option.labelKey)}</ListGroup.ItemTitle>
                  {option.descriptionKey ? (
                    <ListGroup.ItemDescription>
                      {t(option.descriptionKey)}
                    </ListGroup.ItemDescription>
                  ) : null}
                </ListGroup.ItemContent>
                {config.mode === option.value ? (
                  <ListGroup.ItemSuffix>
                    <LocalTick02Icon fill="none" width={24} height={24} color={accent} />
                  </ListGroup.ItemSuffix>
                ) : null}
              </ListGroup.Item>
            </React.Fragment>
          ))}

          {config.mode === "custom" ? (
            <>
              <Separator className="mx-4" />
              <ListGroup.Item>
                <ListGroup.ItemContent>
                  <View className="mb-3 flex-row items-center justify-between">
                    <ListGroup.ItemTitle>
                      {t("settings.trackDuration.minimumDuration")}
                    </ListGroup.ItemTitle>
                    <Text className="text-sm font-medium text-foreground">
                      {formatDuration(resolvedCustomSliderValue)}
                    </Text>
                  </View>
                  <Slider
                    minValue={0}
                    maxValue={600}
                    step={5}
                    value={resolvedCustomSliderValue}
                    isDisabled={isIndexing}
                    onChange={(value) => {
                      setCustomSliderValue(getSliderNumericValue(value))
                    }}
                    onChangeEnd={(value) => {
                      void handleCustomSlidingComplete(getSliderNumericValue(value))
                    }}
                  >
                    <Slider.Track className="h-2 rounded-full bg-border">
                      <Slider.Fill className="rounded-full bg-accent" />
                      <Slider.Thumb />
                    </Slider.Track>
                  </Slider>
                  <Text className="mt-2 text-xs text-muted">
                    {t("settings.trackDuration.changesHint")}
                  </Text>
                </ListGroup.ItemContent>
              </ListGroup.Item>
            </>
          ) : null}
        </ListGroup>
      </View>
    </ScrollView>
  )
}
