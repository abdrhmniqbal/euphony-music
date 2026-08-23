import { ListGroup, Separator } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalTick02Icon from "@/components/icons/local/tick-02"
import { getDeviceLanguageCode } from "@/core/localization/i18n"
import { usePreferenceStore } from "@/core/preferences/store"
import { useThemeColors } from "@/core/theme/use-theme-colors"
import { getLanguageOptions, setLanguageCode } from "@/domains/settings/language"

export function LanguageSettings() {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const languageCode = usePreferenceStore((state) => state.language)
  const deviceLanguageCode = getDeviceLanguageCode()

  const [languageOptions] = React.useState(() => {
    const options = [...getLanguageOptions()]
    const collator = new Intl.Collator(undefined, { sensitivity: "base", usage: "sort" })
    options.sort((left, right) => collator.compare(t(left.labelKey), t(right.labelKey)))

    const selectedIndex = options.findIndex((option) => option.code === languageCode)
    if (selectedIndex <= 0) {
      return options
    }

    const [selectedOption] = options.splice(selectedIndex, 1)
    return selectedOption ? [selectedOption, ...options] : options
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
              <ListGroup.Item onPress={() => void setLanguageCode(option.code)}>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>
                    {getLanguageLabel(option.code, option.labelKey)}
                  </ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>{t(option.nativeLabelKey)}</ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                {languageCode === option.code ? (
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
