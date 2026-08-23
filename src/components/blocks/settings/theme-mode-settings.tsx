import { ListGroup, Separator } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Uniwind } from "uniwind"

import LocalTick02Icon from "@/components/icons/local/tick-02"
import { preferenceStore, usePreferenceStore } from "@/core/preferences/store"
import type { ThemeMode } from "@/core/preferences/types"
import { useThemeColors } from "@/core/theme/use-theme-colors"

type ThemeValue = ThemeMode

const APPEARANCE_OPTIONS: Array<{ labelKey: string; value: ThemeValue }> = [
  { labelKey: "settings.appearance.options.light", value: "light" },
  { labelKey: "settings.appearance.options.dark", value: "dark" },
  { labelKey: "settings.appearance.options.system", value: "system" },
]

export function ThemeModeSettings() {
  const currentMode = usePreferenceStore((state) => state.themeMode)
  const theme = useThemeColors()
  const { t } = useTranslation()

  function handleThemeChange(value: ThemeValue) {
    Uniwind.setTheme(value)
    preferenceStore.setState({ themeMode: value })
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <ListGroup>
          {APPEARANCE_OPTIONS.map((option, index) => (
            <React.Fragment key={option.value}>
              {index > 0 && <Separator className="mx-4" />}
              <ListGroup.Item onPress={() => handleThemeChange(option.value)}>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t(option.labelKey)}</ListGroup.ItemTitle>
                </ListGroup.ItemContent>
                {currentMode === option.value ? (
                  <ListGroup.ItemSuffix>
                    <LocalTick02Icon fill="none" width={24} height={24} color={theme.accent} />
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
