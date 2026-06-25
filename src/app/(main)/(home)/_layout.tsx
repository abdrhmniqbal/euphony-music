/**
 * Purpose: Defines the Home stack and its nested detail routes.
 * Caller: Expo Router main tab layout.
 * Dependencies: Stack, native stack option helpers, home settings action, theme colors.
 * Main Functions: HomeLayout()
 * Side Effects: None beyond rendering navigation state.
 */

import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { useTranslation } from "react-i18next"

import LocalSettings01Icon from "@/components/icons/local/settings-01"
import { BackButton } from "@/components/patterns/back-button"
import { StackHeaderActions } from "@/components/patterns/stack-header-actions"
import { Stack } from "@/layouts/stack"
import {
  getDefaultNativeStackOptions,
  getDrillDownScreenOptions,
  getLargeTitleRootScreenOptions,
} from "@/modules/navigation/stack"
import { useThemeColors } from "@/modules/ui/theme"

export default function HomeLayout() {
  const theme = useThemeColors()
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <Stack screenOptions={getDefaultNativeStackOptions(theme)}>
      <Stack.Screen
        name="index"
        options={getLargeTitleRootScreenOptions({
          title: t("navigation.tabs.home"),
          headerRight: () => (
            <StackHeaderActions
              actions={[
                {
                  key: "settings",
                  onPress: () => router.push("/settings"),
                  icon: (
                    <LocalSettings01Icon
                      fill="none"
                      width={24}
                      height={24}
                      color={theme.foreground}
                    />
                  ),
                },
              ]}
            />
          ),
        })}
      />
      <Stack.Screen
        name="recently-played"
        options={getDrillDownScreenOptions(t("home.recentlyPlayed"), () => (
          <BackButton className="-ml-2" />
        ))}
      />
      <Stack.Screen
        name="top-tracks"
        options={getDrillDownScreenOptions(t("home.topTracks"), () => (
          <BackButton className="-ml-2" />
        ))}
      />
    </Stack>
  )
}
