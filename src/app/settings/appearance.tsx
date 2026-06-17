/**
 * Purpose: Renders appearance preferences for choosing light, dark, or adaptive app theme behavior.
 * Caller: Settings appearance route.
 * Dependencies: Uniwind theme controls, react-i18next, local tick icon, HeroUI Native ListGroup, theme colors.
 * Main Functions: AppearanceSettingsScreen()
 * Side Effects: Persists the selected Uniwind theme mode.
 */

import { ListGroup, Separator } from "heroui-native"
import * as React from "react"
import { ScrollView, View, Text } from "react-native"
import { useTranslation } from "react-i18next"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"

import { useSettingsStore } from "@/modules/settings/store"
import { getLanguageOptions } from "@/modules/localization/language-settings"
import { getDeviceLanguageCode } from "@/modules/localization/i18n"

export default function AppearanceSettingsScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const languageCode = useSettingsStore((state) => state.languageCode)
  const languageOptions = getLanguageOptions()
  const currentOption = languageOptions.find((o) => o.code === languageCode)
  const deviceLanguage = getDeviceLanguageCode()
  const languageLabel = currentOption ? t(currentOption.labelKey) : languageCode
  const displayLanguage =
    languageCode === deviceLanguage
      ? `${languageLabel} ${t("settings.appearance.systemSuffix")}`
      : languageLabel

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <ListGroup>
          <ListGroup.Item onPress={() => router.push("/settings/theme-mode")}>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t("settings.routes.themeMode.title")}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.routes.themeMode.description")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
          <Separator className="mx-4" />
          <ListGroup.Item onPress={() => router.push("/settings/language")}>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t("settings.routes.language.title")}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.appearance.languageDescription", { language: displayLanguage })}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
        </ListGroup>
      </View>
    </ScrollView>
  )
}
