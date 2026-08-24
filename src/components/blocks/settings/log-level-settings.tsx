import { ListGroup, Separator, useThemeColor } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalTick02Icon from "@/components/icons/local/tick-02"
import { preferenceStore, usePreferenceStore } from "@/core/preferences/store"
import type { AppLogLevel } from "@/core/preferences/types"

const LOG_LEVEL_OPTIONS: Array<{ labelKey: string; descriptionKey: string; value: AppLogLevel }> = [
  {
    labelKey: "settings.logLevel.minimal",
    descriptionKey: "settings.logLevel.minimalDescription",
    value: "minimal",
  },
  {
    labelKey: "settings.logLevel.extra",
    descriptionKey: "settings.logLevel.extraDescription",
    value: "extra",
  },
]

export function LogLevelSettings() {
  const accent = useThemeColor("accent")
  const { t } = useTranslation()
  const loggingLevel = usePreferenceStore((state) => state.loggingLevel)

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <ListGroup>
          {LOG_LEVEL_OPTIONS.map((option, index) => (
            <React.Fragment key={option.value}>
              {index > 0 && <Separator className="mx-4" />}
              <ListGroup.Item
                onPress={() => preferenceStore.setState({ loggingLevel: option.value })}
              >
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t(option.labelKey)}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>{t(option.descriptionKey)}</ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                {loggingLevel === option.value ? (
                  <ListGroup.ItemSuffix>
                    <LocalTick02Icon fill="none" width={24} height={24} color={accent} />
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
