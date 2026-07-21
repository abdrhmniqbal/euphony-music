/**
 * Purpose: Defines the Library stack and nested navigation for albums, artists, genres, and playlists.
 * Caller: Expo Router main tab layout.
 * Dependencies: Stack, route transition helpers, settings header action, theme colors.
 * Main Functions: LibraryLayout()
 * Side Effects: None beyond rendering navigation state.
 */

import { useGuardedRouter as useRouter } from "@/modules/navigation"
import { useTranslation } from "react-i18next"

import LocalSettings01Icon from "@/modules/shared/components/icons/local/settings-01"
import { BackButton } from "@/modules/shared/components/patterns/back-button"
import { StackHeaderActions } from "@/modules/shared/components/patterns/stack-header-actions"
import { Stack } from "@/modules/shared/layouts/stack"
import {
  getDefaultNativeStackOptions,
  getDrillDownScreenOptions,
  getHiddenArtistScreenOptions,
  getHiddenBoundaryScreenOptions,
  getHiddenPlaylistScreenOptions,
  getMainRootScreenOptions,
} from "@/modules/navigation"
import { useThemeColors } from "@/modules/ui/theme"

export default function LibraryLayout() {
  const theme = useThemeColors()
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <Stack screenOptions={getDefaultNativeStackOptions(theme)}>
      <Stack.Screen
        name="index"
        options={getMainRootScreenOptions({
          title: t("navigation.tabs.library"),
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
        name="album"
        options={({ route }) => getHiddenBoundaryScreenOptions(route.params)}
      />
      <Stack.Screen
        name="artist"
        options={({ route }) => getHiddenArtistScreenOptions(route.params)}
      />
      <Stack.Screen
        name="genre/[name]"
        options={getDrillDownScreenOptions(t("library.genre"), () => (
          <BackButton className="-ml-2" />
        ))}
      />
      <Stack.Screen
        name="genre/albums"
        options={getDrillDownScreenOptions(t("library.recommendedAlbums"), () => (
          <BackButton className="-ml-2" />
        ))}
      />
      <Stack.Screen
        name="genre/top-tracks"
        options={getDrillDownScreenOptions(t("home.topTracks"), () => (
          <BackButton className="-ml-2" />
        ))}
      />
      <Stack.Screen
        name="playlist"
        options={({ route }) => getHiddenPlaylistScreenOptions(route.params)}
      />
    </Stack>
  )
}
