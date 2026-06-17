/**
 * Purpose: Registers the settings native stack and detail screens.
 * Caller: Expo Router settings route group.
 * Dependencies: Navigation stack helpers, localized settings route titles, theme colors, back and close controls.
 * Main Functions: SettingsLayout()
 * Side Effects: Navigates back, closes settings, or replaces with root route.
 */

import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { PressableFeedback } from "heroui-native"
import { useTranslation } from "react-i18next"

import LocalCancelIcon from "@/components/icons/local/cancel"
import { BackButton } from "@/components/patterns/back-button"
import { Stack } from "@/layouts/stack"
import {
  getCenteredRootScreenOptions,
  getDefaultNativeStackOptions,
  getDrillDownScreenOptions,
} from "@/modules/navigation/stack"
import { SETTINGS_SCREEN_TITLE_KEYS } from "@/modules/settings/routes"
import { useThemeColors } from "@/modules/ui/theme"

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
] as const

export default function SettingsLayout() {
  const theme = useThemeColors()
  const router = useRouter()
  const { t } = useTranslation()
  const handleClose = () => {
    if (router.canGoBack?.()) {
      router.back()
      return
    }

    router.replace("/")
  }

  return (
    <Stack screenOptions={getDefaultNativeStackOptions(theme)}>
      <Stack.Screen
        name="index"
        options={getCenteredRootScreenOptions({
          title: t(SETTINGS_SCREEN_TITLE_KEYS.index),
          headerLeft: () => (
            <PressableFeedback onPress={handleClose} hitSlop={20}>
              <LocalCancelIcon
                fill="none"
                width={24}
                height={24}
                color={theme.foreground}
              />
            </PressableFeedback>
          ),
        })}
      />
      {DETAIL_SETTINGS_SCREENS.map((screenName) => (
        <Stack.Screen
          key={screenName}
          name={screenName}
          options={getDrillDownScreenOptions(
            t(SETTINGS_SCREEN_TITLE_KEYS[screenName]),
            () => <BackButton className="-ml-2" />
          )}
        />
      ))}
    </Stack>
  )
}
