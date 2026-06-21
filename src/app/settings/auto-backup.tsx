import { ListGroup, Separator, Slider, Switch } from "heroui-native"
import * as React from "react"
import { ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalTickIcon from "@/components/icons/local/tick"
import { useThemeColors } from "@/modules/ui/theme"
import { showAppToast } from "@/modules/ui/toast"
import {
  runAutoBackupCheck,
  setAutoBackupConfig,
} from "@/modules/settings/auto-backup"
import { useSettingsStore } from "@/modules/settings/store"

const INTERVAL_OPTIONS = [
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

  async function handleToggle(enabled: boolean) {
    await setAutoBackupConfig({ enabled })
  }

  async function handleIntervalSelect(intervalHours: number) {
    await setAutoBackupConfig({ intervalHours, enabled: true })
    showAppToast(t("settings.autoBackup.title"), t("common.saved"))
  }

  async function handleTargetFolderPick() {
    const { Directory } = await import("expo-file-system")
    const result = await Directory.pickDirectoryAsync()
    if (!result?.uri) return
    await setAutoBackupConfig({ targetDirectoryUri: result.uri, enabled: true })
    showAppToast(t("settings.autoBackup.title"), t("common.saved"))
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <ListGroup>
          <ListGroup.Item>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t("settings.autoBackup.enableAutoBackup")}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>{t("settings.autoBackup.enableAutoBackupDescription")}</ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Switch isSelected={config.enabled} onSelectedChange={handleToggle} />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
        </ListGroup>

        <ListGroup>
          <ListGroup.Item onPress={handleTargetFolderPick}>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t("settings.autoBackup.targetFolder")}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {config.targetDirectoryUri ? t("settings.autoBackup.folderSet") : t("settings.autoBackup.folderUnset")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
        </ListGroup>

        <ListGroup>
          {INTERVAL_OPTIONS.map((opt, idx) => (
            <React.Fragment key={opt.value}>
              {idx > 0 && <Separator className="mx-4" />}
              <ListGroup.Item onPress={() => void handleIntervalSelect(opt.value)}>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t(opt.labelKey)}</ListGroup.ItemTitle>
                </ListGroup.ItemContent>
                {config.intervalHours === opt.value ? (
                  <ListGroup.ItemSuffix>
                    <LocalTickIcon fill="none" width={24} height={24} color={theme.accent} />
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
                <Text className="text-sm font-medium text-foreground">{formatHours(customHours)}</Text>
              </View>
              <Slider
                minValue={1}
                maxValue={720}
                step={1}
                value={customHours}
                onChange={(value) => setCustomHours(Array.isArray(value) ? value[0] ?? 1 : value)}
                onChangeEnd={(value) => void handleIntervalSelect(Array.isArray(value) ? value[0] ?? 1 : value)}
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
