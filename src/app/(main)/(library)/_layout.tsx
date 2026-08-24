import { Stack } from "expo-router"
import { PressableFeedback, useThemeColor } from "heroui-native"
import { useTranslation } from "react-i18next"

import LocalSettings01Icon from "@/components/icons/local/settings-01"
import { useGuardedRouter } from "@/core/navigation"

export default function LibraryLayout() {
  const [background, foreground] = useThemeColor(["background", "foreground"])
  const { t } = useTranslation()
  const router = useGuardedRouter()

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: t("navigation.tabs.library"),
          headerTitleStyle: { color: foreground },
          headerStyle: { backgroundColor: background },
          headerShadowVisible: false,
          headerRight: () => (
            <PressableFeedback onPress={() => router.push("/settings")} hitSlop={12}>
              <LocalSettings01Icon fill="none" width={24} height={24} color={foreground} />
            </PressableFeedback>
          ),
        }}
      />
    </Stack>
  )
}
