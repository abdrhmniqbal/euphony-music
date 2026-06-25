/**
 * Purpose: Renders theme mode selection (Light, Dark, System) as a dedicated settings route.
 * Caller: Settings Appearance route -> Theme Mode navigation.
 * Dependencies: HeroUI Native ListGroup, react-i18next, Uniwind theme, theme colors.
 * Main Functions: ThemeModeSettingsScreen()
 * Side Effects: Persists selected theme via Uniwind.setTheme().
 */

import { ListGroup, Separator } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Uniwind } from "uniwind"

import LocalTick02Icon from "@/components/icons/local/tick-02"
import { preferenceStore, usePreferenceStore } from "@/stores/preference/store"
import { useThemeColors } from "@/modules/ui/theme"

type ThemeValue = "light" | "dark" | "system"

interface AppearanceOption {
  labelKey: string
  value: ThemeValue
}

const APPEARANCE_OPTIONS: AppearanceOption[] = [
  { labelKey: "settings.appearance.options.light", value: "light" },
  { labelKey: "settings.appearance.options.dark", value: "dark" },
  { labelKey: "settings.appearance.options.system", value: "system" },
]

export default function ThemeModeSettingsScreen() {
  const currentMode = usePreferenceStore((state) => state.theme) as ThemeValue
  const theme = useThemeColors()
  const { t } = useTranslation()

  function handleThemeChange(value: ThemeValue) {
    Uniwind.setTheme(value)
    preferenceStore.setState({ theme: value })
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
                {currentMode === option.value && (
                  <ListGroup.ItemSuffix>
                    <LocalTick02Icon fill="none" width={24} height={24} color={theme.accent} />
                  </ListGroup.ItemSuffix>
                )}
              </ListGroup.Item>
            </React.Fragment>
          ))}
        </ListGroup>
      </View>
    </ScrollView>
  )
}
