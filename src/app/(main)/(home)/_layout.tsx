import { Stack } from "expo-router"
import { PressableFeedback, useThemeColor } from "heroui-native"
import { useTranslation } from "react-i18next"

import LocalSettings01Icon from "@/components/icons/local/settings-01"
import { useGuardedRouter } from "@/core/navigation"

export default function HomeLayout() {
  const [background, foreground] = useThemeColor(["background", "foreground"])
  const { t } = useTranslation()
  const router = useGuardedRouter()

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: t("navigation.tabs.home"),
          headerTintColor: foreground,
          headerTitleStyle: { color: foreground },
          headerTitleAlign: "left",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: background },
          headerRight: () => (
            <PressableFeedback onPress={() => router.push("/settings")} hitSlop={12}>
              <LocalSettings01Icon fill="none" width={24} height={24} color={foreground} />
            </PressableFeedback>
          ),
        }}
      />
      <Stack.Screen name="recently-played" options={{ animation: "fade_from_bottom" }} />
      <Stack.Screen name="top-tracks" options={{ animation: "fade_from_bottom" }} />
    </Stack>
  )
}
