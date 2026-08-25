import { PressableFeedback, useThemeColor } from "heroui-native"
import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import LocalCancel01Icon from "@/components/icons/local/cancel-01"
import { BackButton } from "@/components/patterns/back-button"
import { useGuardedRouter } from "@/core/navigation"
import { SETTINGS_SCREEN_TITLE_KEYS } from "@/domains/settings/routes"

const DETAIL_SETTINGS_SCREENS = [
  "appearance",
  "language",
  "audio",
  "notifications",
  "library",
  "advanced",
  "about",
  "folder-filters",
  "split-multiple-values",
  "track-duration-filter",
  "log-level",
  "artist-split-mode",
  "open-source-licenses",
  "whats-new",
  "theme-mode",
  "theme",
  "library-tabs",
  "integrations",
  "backup",
  "auto-backup",
] as const

export default function SettingsLayout() {
  const router = useGuardedRouter()
  const { t } = useTranslation()
  const [background, foreground] = useThemeColor(["background", "foreground"])

  function handleClose() {
    if (router.canGoBack?.()) {
      router.back()
      return
    }

    router.replace("/(main)")
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: "fade_from_bottom",
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
          title: t(SETTINGS_SCREEN_TITLE_KEYS.index),
          headerLeft: () => (
            <PressableFeedback onPress={handleClose} hitSlop={20}>
              <LocalCancel01Icon fill="none" width={24} height={24} color={foreground} />
            </PressableFeedback>
          ),
        }}
      />
      {DETAIL_SETTINGS_SCREENS.map((screenName) => (
        <Stack.Screen
          key={screenName}
          name={screenName}
          options={{
            title: t(SETTINGS_SCREEN_TITLE_KEYS[screenName]),
            headerLeft: () => <BackButton className="-ml-2" />,
          }}
        />
      ))}
    </Stack>
  )
}
