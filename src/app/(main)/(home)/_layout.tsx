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
        headerShown: true,
        headerStyle: { backgroundColor: background },
        headerTintColor: foreground,
        headerTitleStyle: { color: foreground },
        headerTitleAlign: "center",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t("navigation.tabs.home"),
          headerTitleAlign: "left",
          headerRight: () => (
            <PressableFeedback onPress={() => router.push("/settings")} hitSlop={12}>
              <LocalSettings01Icon fill="none" width={24} height={24} color={foreground} />
            </PressableFeedback>
          ),
        }}
      />
      <Stack.Screen
        name="recently-played"
        options={{ title: t("home.recentlyPlayed"), animation: "fade_from_bottom" }}
      />
      <Stack.Screen
        name="top-tracks"
        options={{ title: t("home.topTracks"), animation: "fade_from_bottom" }}
      />
    </Stack>
  )
}
