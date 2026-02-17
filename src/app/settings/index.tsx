import * as React from "react"
import { useRouter } from "expo-router"
import { PressableFeedback } from "heroui-native"
import { ScrollView, Text, View } from "react-native"
import { useUniwind } from "uniwind"

import { useThemeColors } from "@/hooks/use-theme-colors"
import LocalChevronRightIcon from "@/components/icons/local/chevron-right"

interface SettingItemProps {
  title: string
  value?: string
  onPress?: () => void
  showChevron?: boolean
  rightIcon?: React.ReactNode
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  value,
  onPress,
  showChevron = true,
  rightIcon,
}) => {
  const theme = useThemeColors()

  return (
    <PressableFeedback
      onPress={onPress}
      className="flex-row items-center bg-background px-6 py-4 active:opacity-70"
    >
      <Text className="flex-1 text-[17px] font-normal text-foreground">
        {title}
      </Text>
      <View className="flex-row items-center gap-2">
        {value && <Text className="text-[15px] text-muted">{value}</Text>}
        {rightIcon}
        {showChevron && (
          <LocalChevronRightIcon
            fill="none"
            width={20}
            height={20}
            color={theme.muted}
          />
        )}
      </View>
    </PressableFeedback>
  )
}

interface SectionHeaderProps {
  title: string
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
  <View className="px-6 pt-8 pb-3">
    <Text className="text-[13px] font-medium tracking-wider text-muted uppercase">
      {title}
    </Text>
  </View>
)

interface SettingSection {
  title: string
  items: {
    id: string
    title: string
    value?: string
    route?: string
    showChevron?: boolean
  }[]
}

const SETTINGS_SECTIONS: SettingSection[] = [
  {
    title: "Interface",
    items: [
      { id: "appearance", title: "Appearance", route: "/settings/appearance" },
    ],
  },
]

export default function SettingsScreen() {
  const router = useRouter()
  const { theme: currentTheme, hasAdaptiveThemes } = useUniwind()

  const currentAppearance = hasAdaptiveThemes
    ? "System"
    : currentTheme === "dark"
      ? "Dark"
      : "Light"

  function handleItemPress(route?: string) {
    if (route) {
      router.push(route as never)
    }
  }

  function getItemValue(itemId: string): string | undefined {
    switch (itemId) {
      case "appearance":
        return currentAppearance
      default:
        return undefined
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {SETTINGS_SECTIONS.map((section) => (
        <View key={section.title}>
          <SectionHeader title={section.title} />
          {section.items.map((item) => (
            <SettingItem
              key={item.id}
              title={item.title}
              value={getItemValue(item.id)}
              onPress={() => handleItemPress(item.route)}
              showChevron={item.showChevron !== false}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  )
}
