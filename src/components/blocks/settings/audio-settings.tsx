import { ListGroup, Separator, Slider, Switch } from "heroui-native"
import * as React from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import {
  SettingsListGroup,
  SettingsScrollView,
  SettingsSwitchRow,
} from "@/components/blocks/settings/ui"
import { preferenceStore, usePreferenceStore } from "@/core/preferences/store"
import type { AudioPlaybackConfig } from "@/core/preferences/types"

function getSliderNumericValue(value: number | number[]): number {
  return Array.isArray(value) ? (value[0] ?? 0) : value
}

export function AudioSettings() {
  const { t } = useTranslation()
  const audioPlaybackConfig = usePreferenceStore((state) => state.audioPlaybackConfig)
  const crossfadeConfig = usePreferenceStore((state) => state.crossfadeConfig)
  const [sliderValue, setSliderValue] = React.useState<number | null>(null)
  const resolvedSliderValue = sliderValue ?? crossfadeConfig.durationSeconds

  function updateAudioPlaybackConfig(key: keyof AudioPlaybackConfig, value: boolean) {
    preferenceStore.setState({
      audioPlaybackConfig: { ...audioPlaybackConfig, [key]: value },
    })
  }

  function handleCrossfadeToggle(isEnabled: boolean) {
    setSliderValue(null)
    preferenceStore.setState({ crossfadeConfig: { ...crossfadeConfig, isEnabled } })
  }

  function handleCrossfadeSlidingComplete(value: number) {
    preferenceStore.setState({
      crossfadeConfig: { isEnabled: true, durationSeconds: value },
    })
  }

  return (
    <SettingsScrollView>
      <View className="gap-2">
        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.audio.sections.transitions")}
        </Text>
        <SettingsListGroup>
          <SettingsSwitchRow
            title={t("settings.audio.fadePlayPauseStop")}
            description={t("settings.audio.fadePlayPauseStopDescription")}
            isSelected={audioPlaybackConfig.fadePlayPauseStop}
            onSelectedChange={(isSelected) =>
              updateAudioPlaybackConfig("fadePlayPauseStop", isSelected)
            }
          />
          <SettingsSwitchRow
            title={t("settings.audio.fadeOnSeek")}
            description={t("settings.audio.fadeOnSeekDescription")}
            isSelected={audioPlaybackConfig.fadeOnSeek}
            onSelectedChange={(isSelected) => updateAudioPlaybackConfig("fadeOnSeek", isSelected)}
          />
        </SettingsListGroup>
      </View>

      <View className="gap-2">
        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.audio.sections.resume")}
        </Text>
        <SettingsListGroup>
          <SettingsSwitchRow
            title={t("settings.audio.resumeAfterCall")}
            description={t("settings.audio.resumeAfterCallDescription")}
            isSelected={audioPlaybackConfig.resumeAfterCall}
            onSelectedChange={(isSelected) =>
              updateAudioPlaybackConfig("resumeAfterCall", isSelected)
            }
          />
          <SettingsSwitchRow
            title={t("settings.audio.resumeOnStart")}
            description={t("settings.audio.resumeOnStartDescription")}
            isSelected={audioPlaybackConfig.resumeOnStart}
            onSelectedChange={(isSelected) =>
              updateAudioPlaybackConfig("resumeOnStart", isSelected)
            }
          />
          <SettingsSwitchRow
            title={t("settings.audio.resumeOnReopen")}
            description={t("settings.audio.resumeOnReopenDescription")}
            isSelected={audioPlaybackConfig.resumeOnReopen}
            onSelectedChange={(isSelected) =>
              updateAudioPlaybackConfig("resumeOnReopen", isSelected)
            }
          />
          <SettingsSwitchRow
            title={t("settings.audio.resumeOnFocusGain")}
            description={t("settings.audio.resumeOnFocusGainDescription")}
            isSelected={audioPlaybackConfig.resumeOnFocusGain}
            onSelectedChange={(isSelected) =>
              updateAudioPlaybackConfig("resumeOnFocusGain", isSelected)
            }
          />
        </SettingsListGroup>
      </View>

      <View className="gap-2">
        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.audio.sections.audioFocus")}
        </Text>
        <SettingsListGroup>
          <SettingsSwitchRow
            title={t("settings.audio.shortAudioFocusChange")}
            description={t("settings.audio.shortAudioFocusChangeDescription")}
            isSelected={audioPlaybackConfig.shortAudioFocusChange}
            onSelectedChange={(isSelected) =>
              updateAudioPlaybackConfig("shortAudioFocusChange", isSelected)
            }
          />
          <SettingsSwitchRow
            title={t("settings.audio.pauseInCall")}
            description={t("settings.audio.pauseInCallDescription")}
            isSelected={audioPlaybackConfig.pauseInCall}
            onSelectedChange={(isSelected) => updateAudioPlaybackConfig("pauseInCall", isSelected)}
          />
          <SettingsSwitchRow
            title={t("settings.audio.duckVolume")}
            description={t("settings.audio.duckVolumeDescription")}
            isSelected={audioPlaybackConfig.duckVolume}
            onSelectedChange={(isSelected) => updateAudioPlaybackConfig("duckVolume", isSelected)}
          />
          <SettingsSwitchRow
            title={t("settings.audio.permanentAudioFocusChange")}
            description={t("settings.audio.permanentAudioFocusChangeDescription")}
            isSelected={audioPlaybackConfig.permanentAudioFocusChange}
            onSelectedChange={(isSelected) =>
              updateAudioPlaybackConfig("permanentAudioFocusChange", isSelected)
            }
          />
        </SettingsListGroup>
      </View>

      <View className="gap-2">
        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.audio.sections.crossfade")}
        </Text>
        <ListGroup>
          <ListGroup.Item>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t("settings.audio.crossfade")}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {crossfadeConfig.isEnabled
                  ? t("settings.audio.crossfadeEnabled")
                  : t("settings.audio.crossfadeDisabled")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Switch
                isSelected={crossfadeConfig.isEnabled}
                onSelectedChange={(isSelected) => {
                  handleCrossfadeToggle(isSelected)
                }}
              />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>

          {crossfadeConfig.isEnabled ? (
            <>
              <Separator className="mx-4" />
              <ListGroup.Item>
                <ListGroup.ItemContent>
                  <View className="mb-3 flex-row items-center justify-between">
                    <ListGroup.ItemTitle>{t("settings.audio.duration")}</ListGroup.ItemTitle>
                    <Text className="text-sm font-medium text-foreground">
                      {Math.round(resolvedSliderValue)}s
                    </Text>
                  </View>
                  <Slider
                    minValue={1}
                    maxValue={12}
                    step={1}
                    value={resolvedSliderValue}
                    onChange={(value) => {
                      setSliderValue(getSliderNumericValue(value))
                    }}
                    onChangeEnd={(value) => {
                      handleCrossfadeSlidingComplete(getSliderNumericValue(value))
                    }}
                  >
                    <Slider.Track className="h-2 rounded-full bg-border">
                      <Slider.Fill className="rounded-full bg-accent" />
                      <Slider.Thumb />
                    </Slider.Track>
                  </Slider>
                  <Text className="mt-2 text-xs text-muted">{t("settings.audio.durationHint")}</Text>
                </ListGroup.ItemContent>
              </ListGroup.Item>
            </>
          ) : null}
        </ListGroup>
      </View>
    </SettingsScrollView>
  )
}
