/**
 * Purpose: Renders app language selection settings.
 * Caller: Settings language route.
 * Dependencies: HeroUI Native ListGroup, react-i18next, localization settings service, settings store, theme colors, device language detection.
 * Main Functions: LanguageSettingsScreen()
 * Side Effects: Persists the selected language and updates i18next language.
 */

import { ListGroup, Separator } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalTickIcon from "@/components/icons/local/tick"
import { getLanguageOptions, setLanguageCode } from "@/modules/localization/language-settings"
import { getDeviceLanguageCode } from "@/modules/localization/i18n"
import { useSettingsStore } from "@/modules/settings/store"
import { useThemeColors } from "@/modules/ui/theme"

export default function LanguageSettingsScreen() {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const languageCode = useSettingsStore((state) => state.languageCode)
  const deviceLanguageCode = getDeviceLanguageCode()

  function getSortedLanguageOptions(selectedLanguageCode: string) {
    const options = [...getLanguageOptions()]
    const collator = new Intl.Collator(undefined, {
      sensitivity: "base",
      usage: "sort",
    })

    const sortedOptions = options.sort((left, right) =>
      collator.compare(t(left.labelKey), t(right.labelKey))
    )
    const selectedIndex = sortedOptions.findIndex((option) => option.code === selectedLanguageCode)

    if (selectedIndex <= 0) {
      return sortedOptions
    }

    const [selectedOption] = sortedOptions.splice(selectedIndex, 1)
    return selectedOption ? [selectedOption, ...sortedOptions] : sortedOptions
  }

  const [languageOptions] = React.useState(() => {
    return getSortedLanguageOptions(languageCode)
  })

  function getLanguageLabel(optionCode: string, labelKey: string) {
    const label = t(labelKey)

    return optionCode === deviceLanguageCode
      ? `${label} ${t("settings.appearance.systemSuffix")}`
      : label
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <ListGroup>
          {languageOptions.map((option, index) => (
            <React.Fragment key={option.code}>
              {index > 0 && <Separator className="mx-4" />}
              <ListGroup.Item
                onPress={() => {
                  void setLanguageCode(option.code)
                }}
              >
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>
                    {getLanguageLabel(option.code, option.labelKey)}
                  </ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>{t(option.nativeLabelKey)}</ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                {languageCode === option.code ? (
                  <ListGroup.ItemSuffix>
                    <LocalTickIcon fill="none" width={24} height={24} color={theme.accent} />
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
