import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { useThemeColors } from "@/core/theme/use-theme-colors"

export default function LibraryLayout() {
  const theme = useThemeColors()
  const { t } = useTranslation()

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: t("navigation.tabs.library"),
          headerTitleStyle: { color: theme.foreground },
          headerStyle: { backgroundColor: theme.background },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  )
}
