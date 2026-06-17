/**
 * Purpose: Renders audio playback preferences, including transitions, resume behavior, audio focus, and crossfade controls.
 * Caller: Settings audio route.
 * Dependencies: HeroUI Native ListGroup, switch and slider, react-i18next, audio playback and crossfade settings modules.
 * Main Functions: AudioSettingsScreen()
 * Side Effects: Persists audio playback and crossfade preferences in document storage.
 */

import { ListGroup, Separator, Slider, Switch } from "heroui-native"
import * as React from "react"
import { ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import { setAudioPlaybackConfig, type AudioPlaybackConfig } from "@/modules/settings/audio-playback"
import { setCrossfadeConfig } from "@/modules/settings/audio-crossfade"
import { useSettingsStore } from "@/modules/settings/store"

function getSliderNumericValue(value: number | number[]): number {
  return Array.isArray(value) ? (value[0] ?? 0) : value
}

function AudioSwitchRow({
  title,
  description,
  isSelected,
  onSelectedChange,
}: {
  title: string
  description: string
  isSelected: boolean
  onSelectedChange: (isSelected: boolean) => void
}) {
  return (
    <ListGroup.Item>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
        <ListGroup.ItemDescription>{description}</ListGroup.ItemDescription>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>
        <Switch isSelected={isSelected} onSelectedChange={onSelectedChange} />
      </ListGroup.ItemSuffix>
    </ListGroup.Item>
  )
}

export default function AudioSettingsScreen() {
  const { t } = useTranslation()
  const crossfadeConfig = useSettingsStore((state) => state.crossfadeConfig)
  const audioPlaybackConfig = useSettingsStore((state) => state.audioPlaybackConfig)
  const [sliderValue, setSliderValue] = React.useState<number | null>(null)
  const resolvedSliderValue = sliderValue ?? crossfadeConfig.durationSeconds

  const updateAudioPlaybackConfig = (key: keyof AudioPlaybackConfig, value: boolean) => {
    void setAudioPlaybackConfig({
      [key]: value,
    } as Partial<AudioPlaybackConfig>)
  }

  async function handleCrossfadeToggle(isEnabled: boolean) {
    setSliderValue(null)
    await setCrossfadeConfig({ isEnabled })
  }

  async function handleCrossfadeSlidingComplete(value: number) {
    await setCrossfadeConfig({
      isEnabled: true,
      durationSeconds: value,
    })
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase text-muted">
            {t("settings.audio.sections.transitions")}
          </Text>
          <ListGroup>
            <AudioSwitchRow
              title={t("settings.audio.fadePlayPauseStop")}
              description={t("settings.audio.fadePlayPauseStopDescription")}
              isSelected={audioPlaybackConfig.fadePlayPauseStop}
              onSelectedChange={(isSelected) =>
                updateAudioPlaybackConfig("fadePlayPauseStop", isSelected)
              }
            />
            <Separator className="mx-4" />
            <AudioSwitchRow
              title={t("settings.audio.fadeOnSeek")}
              description={t("settings.audio.fadeOnSeekDescription")}
              isSelected={audioPlaybackConfig.fadeOnSeek}
              onSelectedChange={(isSelected) => updateAudioPlaybackConfig("fadeOnSeek", isSelected)}
            />
          </ListGroup>
        </View>

        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase text-muted">
            {t("settings.audio.sections.resume")}
          </Text>
          <ListGroup>
            <AudioSwitchRow
              title={t("settings.audio.resumeAfterCall")}
              description={t("settings.audio.resumeAfterCallDescription")}
              isSelected={audioPlaybackConfig.resumeAfterCall}
              onSelectedChange={(isSelected) =>
                updateAudioPlaybackConfig("resumeAfterCall", isSelected)
              }
            />
            <Separator className="mx-4" />
            <AudioSwitchRow
              title={t("settings.audio.resumeOnStart")}
              description={t("settings.audio.resumeOnStartDescription")}
              isSelected={audioPlaybackConfig.resumeOnStart}
              onSelectedChange={(isSelected) =>
                updateAudioPlaybackConfig("resumeOnStart", isSelected)
              }
            />
            <Separator className="mx-4" />
            <AudioSwitchRow
              title={t("settings.audio.resumeOnReopen")}
              description={t("settings.audio.resumeOnReopenDescription")}
              isSelected={audioPlaybackConfig.resumeOnReopen}
              onSelectedChange={(isSelected) =>
                updateAudioPlaybackConfig("resumeOnReopen", isSelected)
              }
            />
            <Separator className="mx-4" />
            <AudioSwitchRow
              title={t("settings.audio.resumeOnFocusGain")}
              description={t("settings.audio.resumeOnFocusGainDescription")}
              isSelected={audioPlaybackConfig.resumeOnFocusGain}
              onSelectedChange={(isSelected) =>
                updateAudioPlaybackConfig("resumeOnFocusGain", isSelected)
              }
            />
          </ListGroup>
        </View>

        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase text-muted">
            {t("settings.audio.sections.audioFocus")}
          </Text>
          <ListGroup>
            <AudioSwitchRow
              title={t("settings.audio.shortAudioFocusChange")}
              description={t("settings.audio.shortAudioFocusChangeDescription")}
              isSelected={audioPlaybackConfig.shortAudioFocusChange}
              onSelectedChange={(isSelected) =>
                updateAudioPlaybackConfig("shortAudioFocusChange", isSelected)
              }
            />
            <Separator className="mx-4" />
            <AudioSwitchRow
              title={t("settings.audio.pauseInCall")}
              description={t("settings.audio.pauseInCallDescription")}
              isSelected={audioPlaybackConfig.pauseInCall}
              onSelectedChange={(isSelected) =>
                updateAudioPlaybackConfig("pauseInCall", isSelected)
              }
            />
            <Separator className="mx-4" />
            <AudioSwitchRow
              title={t("settings.audio.duckVolume")}
              description={t("settings.audio.duckVolumeDescription")}
              isSelected={audioPlaybackConfig.duckVolume}
              onSelectedChange={(isSelected) => updateAudioPlaybackConfig("duckVolume", isSelected)}
            />
            <Separator className="mx-4" />
            <AudioSwitchRow
              title={t("settings.audio.permanentAudioFocusChange")}
              description={t("settings.audio.permanentAudioFocusChangeDescription")}
              isSelected={audioPlaybackConfig.permanentAudioFocusChange}
              onSelectedChange={(isSelected) =>
                updateAudioPlaybackConfig("permanentAudioFocusChange", isSelected)
              }
            />
          </ListGroup>
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
                    void handleCrossfadeToggle(isSelected)
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
                        void handleCrossfadeSlidingComplete(getSliderNumericValue(value))
                      }}
                    >
                      <Slider.Track className="h-2 rounded-full bg-border">
                        <Slider.Fill className="rounded-full bg-accent" />
                        <Slider.Thumb />
                      </Slider.Track>
                    </Slider>
                    <Text className="mt-2 text-xs text-muted">
                      {t("settings.audio.durationHint")}
                    </Text>
                  </ListGroup.ItemContent>
                </ListGroup.Item>
              </>
            ) : null}
          </ListGroup>
        </View>
      </View>
    </ScrollView>
  )
}
