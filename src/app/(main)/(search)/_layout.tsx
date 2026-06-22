/**
 * Purpose: Defines the Search stack and its nested detail routes.
 * Caller: Expo Router main tab layout.
 * Dependencies: Stack, route transition helpers, settings header action, theme colors.
 * Main Functions: SearchLayout()
 * Side Effects: None beyond rendering navigation state.
 */

import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { useTranslation } from "react-i18next"

import LocalSettingsIcon from "@/components/icons/local/settings"
import { BackButton } from "@/components/patterns/back-button"
import { StackHeaderActions } from "@/components/patterns/stack-header-actions"
import { Stack } from "@/layouts/stack"
import {
  getDefaultNativeStackOptions,
  getDrillDownScreenOptions,
  getHiddenArtistScreenOptions,
  getHiddenBoundaryScreenOptions,
  getHiddenPlaylistScreenOptions,
  getLargeTitleRootScreenOptions,
} from "@/modules/navigation/stack"
import { useThemeColors } from "@/modules/ui/theme"

export default function SearchLayout() {
  const theme = useThemeColors()
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <Stack screenOptions={getDefaultNativeStackOptions(theme)}>
      <Stack.Screen
        name="index"
        options={getLargeTitleRootScreenOptions({
          title: t("navigation.tabs.search"),
          headerRight: () => (
            <StackHeaderActions
              actions={[
                {
                  key: "settings",
                  onPress: () => router.push("/settings"),
                  icon: (
                    <LocalSettingsIcon
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
        name="album"
        options={({ route }) => getHiddenBoundaryScreenOptions(route.params)}
      />
      <Stack.Screen
        name="artist"
        options={({ route }) => getHiddenArtistScreenOptions(route.params)}
      />
      <Stack.Screen
        name="playlist"
        options={({ route }) => getHiddenPlaylistScreenOptions(route.params)}
      />
      <Stack.Screen
        name="mix"
        options={({ route }) => getHiddenPlaylistScreenOptions(route.params)}
      />
      <Stack.Screen
        name="recently-added"
        options={getDrillDownScreenOptions(t("search.recentlyAdded"), () => (
          <BackButton className="-ml-2" />
        ))}
      />
    </Stack>
  )
}
