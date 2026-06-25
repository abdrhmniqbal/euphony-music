import { ListGroup, Separator, Slider } from "heroui-native"
import * as React from "react"
import { ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalTick02Icon from "@/components/icons/local/tick-02"
import { setAutoBackupConfig } from "@/modules/settings/auto-backup"
import { useSettingsStore } from "@/modules/settings/store"
import { useThemeColors } from "@/modules/ui/theme"

const INTERVAL_OPTIONS = [
  { labelKey: "settings.autoBackup.off", value: 0 },
  { labelKey: "settings.autoBackup.every12Hours", value: 12 },
  { labelKey: "settings.autoBackup.every24Hours", value: 24 },
  { labelKey: "settings.autoBackup.every3Days", value: 72 },
  { labelKey: "settings.autoBackup.everyWeek", value: 168 },
] as const

function formatHours(hours: number) {
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return days === 1 ? `1 day` : `${days} days`
}

export default function AutoBackupSettingsScreen() {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const config = useSettingsStore((state) => state.autoBackupConfig)
  const [customHours, setCustomHours] = React.useState(config.intervalHours)

  React.useEffect(() => setCustomHours(config.intervalHours), [config.intervalHours])

  async function handleIntervalSelect(intervalHours: number) {
    await setAutoBackupConfig({
      enabled: intervalHours > 0,
      intervalHours: intervalHours > 0 ? intervalHours : config.intervalHours,
    })
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <ListGroup>
          {INTERVAL_OPTIONS.map((opt, idx) => (
            <React.Fragment key={opt.value}>
              {idx > 0 && <Separator className="mx-4" />}
              <ListGroup.Item onPress={() => void handleIntervalSelect(opt.value)}>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t(opt.labelKey)}</ListGroup.ItemTitle>
                </ListGroup.ItemContent>
                {(config.enabled ? config.intervalHours : 0) === opt.value ? (
                  <ListGroup.ItemSuffix>
                    <LocalTick02Icon fill="none" width={24} height={24} color={theme.accent} />
                  </ListGroup.ItemSuffix>
                ) : null}
              </ListGroup.Item>
            </React.Fragment>
          ))}
          <Separator className="mx-4" />
          <ListGroup.Item>
            <ListGroup.ItemContent>
              <View className="mb-3 flex-row items-center justify-between">
                <ListGroup.ItemTitle>{t("settings.autoBackup.customInterval")}</ListGroup.ItemTitle>
                <Text className="text-sm font-medium text-foreground">
                  {formatHours(customHours)}
                </Text>
              </View>
              <Slider
                minValue={1}
                maxValue={720}
                step={1}
                value={customHours}
                onChange={(value) => setCustomHours(Array.isArray(value) ? (value[0] ?? 1) : value)}
                onChangeEnd={(value) =>
                  void handleIntervalSelect(Array.isArray(value) ? (value[0] ?? 1) : value)
                }
              >
                <Slider.Track className="h-2 rounded-full bg-border">
                  <Slider.Fill className="rounded-full bg-accent" />
                  <Slider.Thumb />
                </Slider.Track>
              </Slider>
            </ListGroup.ItemContent>
          </ListGroup.Item>
        </ListGroup>
      </View>
    </ScrollView>
  )
}
