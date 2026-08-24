import { ListGroup, Separator, useThemeColor } from "heroui-native"
import * as React from "react"
import { ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalTick02Icon from "@/components/icons/local/tick-02"
import { preferenceStore, usePreferenceStore } from "@/core/preferences/store"

const INTERVAL_OPTIONS = [
  { labelKey: "settings.autoBackup.off", value: 0 },
  { labelKey: "settings.autoBackup.every12Hours", value: 12 },
  { labelKey: "settings.autoBackup.every24Hours", value: 24 },
  { labelKey: "settings.autoBackup.every3Days", value: 72 },
  { labelKey: "settings.autoBackup.everyWeek", value: 168 },
]

export function AutoBackupSettings() {
  const accent = useThemeColor("accent")
  const { t } = useTranslation()
  const config = usePreferenceStore((state) => state.autoBackupConfig)

  function handleIntervalSelect(intervalHours: number) {
    const current = preferenceStore.getState().autoBackupConfig
    preferenceStore.setState({
      autoBackupConfig: {
        ...current,
        enabled: intervalHours > 0,
        intervalHours: intervalHours > 0 ? intervalHours : current.intervalHours,
      },
    })
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <Text className="px-1 text-xs text-muted">{t("settings.autoBackup.hint")}</Text>
        <ListGroup>
          {INTERVAL_OPTIONS.map((option, index) => (
            <React.Fragment key={option.value}>
              {index > 0 && <Separator className="mx-4" />}
              <ListGroup.Item onPress={() => handleIntervalSelect(option.value)}>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t(option.labelKey)}</ListGroup.ItemTitle>
                </ListGroup.ItemContent>
                {(config.enabled ? config.intervalHours : 0) === option.value ? (
                  <ListGroup.ItemSuffix>
                    <LocalTick02Icon fill="none" width={24} height={24} color={accent} />
                  </ListGroup.ItemSuffix>
                ) : null}
              </ListGroup.Item>
            </React.Fragment>
          ))}
          <Separator className="mx-4" />
          <ListGroup.Item>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {config.enabled
                  ? t("settings.autoBackup.lastBackup")
                  : t("settings.autoBackup.neverRun")}
              </ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {config.lastBackupAt
                  ? new Date(config.lastBackupAt).toLocaleString()
                  : t("settings.autoBackup.disabledDescription")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
          </ListGroup.Item>
        </ListGroup>
      </View>
    </ScrollView>
  )
}
