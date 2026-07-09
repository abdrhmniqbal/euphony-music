import { ListGroup, Separator } from "heroui-native"
import * as React from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import LocalTick02Icon from "@/modules/shared/components/icons/local/tick-02"

type ThemeValue = "light" | "dark" | "system"

const THEME_OPTIONS: Array<{ value: ThemeValue; labelKey: string }> = [
  { value: "light", labelKey: "settings.appearance.options.light" },
  { value: "dark", labelKey: "settings.appearance.options.dark" },
  { value: "system", labelKey: "settings.appearance.options.system" },
]

interface ThemeStepProps {
  stepTitle: string
  currentMode: ThemeValue
  accentColor: string
  onThemeChange: (value: ThemeValue) => void
}

export function ThemeStep({ stepTitle, currentMode, accentColor, onThemeChange }: ThemeStepProps) {
  const { t } = useTranslation()

  return (
    <View className="gap-2">
      <Text className="px-1 text-xs font-semibold uppercase text-muted">{stepTitle}</Text>
      <ListGroup>
        {THEME_OPTIONS.map((option, index) => (
          <React.Fragment key={option.value}>
            {index > 0 && <Separator className="mx-4" />}
            <ListGroup.Item onPress={() => onThemeChange(option.value)}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t(option.labelKey)}</ListGroup.ItemTitle>
              </ListGroup.ItemContent>
              {currentMode === option.value ? (
                <ListGroup.ItemSuffix>
                  <LocalTick02Icon fill="none" width={24} height={24} color={accentColor} />
                </ListGroup.ItemSuffix>
              ) : null}
            </ListGroup.Item>
          </React.Fragment>
        ))}
      </ListGroup>
    </View>
  )
}
