/**
 * Purpose: Renders logging verbosity preferences for error-only or full diagnostic logging.
 * Caller: Settings log-level route.
 * Dependencies: HeroUI Native ListGroup, react-i18next, logging store, settings store, theme colors.
 * Main Functions: LogLevelSettingsScreen()
 * Side Effects: Persists the selected application log level.
 */

import { ListGroup, Separator } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalTickIcon from "@/components/icons/local/tick"
import { useThemeColors } from "@/modules/ui/theme"
import {
  type AppLogLevel,
  setAppLogLevel,
} from "@/modules/logging/store"
import { useSettingsStore } from "@/modules/settings/store"

interface LogLevelOption {
  labelKey: string
  value: AppLogLevel
  descriptionKey: string
}

const LOG_LEVEL_OPTIONS: LogLevelOption[] = [
  {
    labelKey: "settings.logLevel.minimal",
    value: "minimal",
    descriptionKey: "settings.logLevel.minimalDescription",
  },
  {
    labelKey: "settings.logLevel.extra",
    value: "extra",
    descriptionKey: "settings.logLevel.extraDescription",
  },
]

export default function LogLevelSettingsScreen() {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const loggingLevel = useSettingsStore((state) => state.loggingConfig.level)

  async function handleSelect(level: AppLogLevel) {
    await setAppLogLevel(level)
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="gap-5 px-4 py-4">
        <ListGroup >
          {LOG_LEVEL_OPTIONS.map((option, index) => (
            <React.Fragment key={option.value}>
              {index > 0 && <Separator className="mx-4" />}
              <ListGroup.Item
                onPress={() => {
                  void handleSelect(option.value)
                }}
              >
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t(option.labelKey)}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>
                    {t(option.descriptionKey)}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                {loggingLevel === option.value ? (
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
