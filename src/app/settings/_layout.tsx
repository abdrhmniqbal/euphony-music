import { PressableFeedback } from "heroui-native"
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

  function handleClose() {
    if (router.canGoBack?.()) {
      router.back()
      return
    }

    router.replace("/(main)")
  }

  return (
    <Stack screenOptions={{ headerShown: true, animation: "fade_from_bottom" }}>
      <Stack.Screen
        name="index"
        options={{
          title: t(SETTINGS_SCREEN_TITLE_KEYS.index),
          headerLeft: () => (
            <PressableFeedback onPress={handleClose} hitSlop={20}>
              <LocalCancel01Icon fill="none" width={24} height={24} />
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
