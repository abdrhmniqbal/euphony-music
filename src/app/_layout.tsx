/**
 * Purpose: Boots the app shell, sets navigation theme, handles notifications, and defines the root stack.
 * Caller: Expo Router root entry point.
 * Dependencies: RootProviders, bootstrap runtime, notification runtime, update runtime, HeroUI Native, Expo Router stack options, player UI state.
 * Main Functions: Layout()
 * Side Effects: Starts notification runtime, drives splash-screen visibility, triggers bootstrap lifecycle, routes into player/settings screens.
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation"
import { useSegments } from "expo-router"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import * as SplashScreen from "expo-splash-screen"
import { HeroUINativeProvider } from "heroui-native"
import { type ReactNode, useRef } from "react"
import { View } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useUniwind } from "uniwind"

import { RootProviders } from "@/components/providers/root-providers"
import { AppUpdateSheet } from "@/components/blocks/app-update-sheet"
import { AppToastRuntime } from "@/components/providers/app-toast-runtime"
import { getTabBarHeight, MINI_PLAYER_HEIGHT } from "@/constants/layout"
import { Stack } from "@/layouts/stack"
import {
  handleBootstrapDatabaseError,
  handleBootstrapDatabaseReady,
} from "@/modules/bootstrap/runtime"
import { checkStartupAppUpdate } from "@/modules/updates/app-update.runtime"
import { ROOT_MODAL_SCREEN_OPTIONS, getHiddenPlayerScreenOptions } from "@/modules/navigation/stack"
import {
  ensureNotificationRuntimeStarted,
  setNotificationRouteHandler,
} from "@/modules/notifications/notification-runtime"
import { useHasCurrentTrack } from "@/modules/player/selectors"
import { useThemeColors } from "@/modules/ui/theme"
import { useUIStore } from "@/modules/ui/store"

import "../global.css"

const TOAST_OFFSET_ANIMATION_DURATION_MS = 250
const TOAST_HIDDEN_BOTTOM_GAP = 0
const TOAST_VISIBLE_BOTTOM_GAP = 0
const SETTINGS_FOLDER_FILTERS_ACTION_HEIGHT = 56
const SETTINGS_FOLDER_FILTERS_ACTION_TOP_PADDING = 12

function ToastAnimatedWrapper({
  children,
  extraBottom,
}: {
  children: ReactNode
  extraBottom: number
}) {
  const animatedExtraBottom = useDerivedValue(() => {
    return withTiming(extraBottom, {
      duration: TOAST_OFFSET_ANIMATION_DURATION_MS,
    })
  }, [extraBottom])

  const animatedStyle = useAnimatedStyle(() => ({
    paddingBottom: animatedExtraBottom.value,
    zIndex: 2100,
    elevation: 2100,
  }))

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]} pointerEvents="box-none">
      {children}
    </Animated.View>
  )
}

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
})
void SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash screen might be already prevented by native/runtime.
})

export default function Layout() {
  const router = useRouter()
  const { theme: currentTheme } = useUniwind()
  const theme = useThemeColors()
  const segments = useSegments()
  const insets = useSafeAreaInsets()
  const barsVisible = useUIStore((state) => state.barsVisible)
  const hasMiniPlayer = useHasCurrentTrack()
  const hasHiddenSplashRef = useRef(false)
  setNotificationRouteHandler((route) => {
    router.push(route as never)
  })
  ensureNotificationRuntimeStarted()

  const hideSplash = () => {
    if (hasHiddenSplashRef.current) {
      return
    }

    hasHiddenSplashRef.current = true
    void SplashScreen.hideAsync().catch(() => {
      // Ignore hide race if splash is already hidden.
    })
  }
  const notifyDatabaseReady = async () => {
    await handleBootstrapDatabaseReady()
    void checkStartupAppUpdate()
    hideSplash()
  }
  const notifyDatabaseError = () => {
    handleBootstrapDatabaseError()
    hideSplash()
  }
  const tabBarHeight = getTabBarHeight(insets.bottom)
  const isMainTabsRoute = segments[0] === "(main)"
  const isFolderFiltersRoute = segments[0] === "settings" && segments.at(1) === "folder-filters"
  const folderFiltersToastOffset = isFolderFiltersRoute
    ? SETTINGS_FOLDER_FILTERS_ACTION_HEIGHT +
      Math.max(insets.bottom, SETTINGS_FOLDER_FILTERS_ACTION_TOP_PADDING)
    : 0
  const toastExtraBottomOffset = isMainTabsRoute
    ? barsVisible
      ? tabBarHeight + (hasMiniPlayer ? MINI_PLAYER_HEIGHT : 0) + TOAST_VISIBLE_BOTTOM_GAP
      : TOAST_HIDDEN_BOTTOM_GAP
    : folderFiltersToastOffset

  const navigationTheme = {
    ...(currentTheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(currentTheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.background,
      text: theme.foreground,
      border: theme.border,
      notification: theme.accent,
    },
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <ThemeProvider value={navigationTheme}>
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <HeroUINativeProvider
            config={{
              devInfo: { stylingPrinciples: false },
              toast: {
                defaultProps: {
                  placement: "bottom",
                },
                contentWrapper: (children: ReactNode) => (
                  <ToastAnimatedWrapper extraBottom={toastExtraBottomOffset}>
                    {children}
                  </ToastAnimatedWrapper>
                ),
              },
            }}
          >
            <RootProviders
              onDatabaseReady={notifyDatabaseReady}
              onDatabaseError={notifyDatabaseError}
            >
              <View className="flex-1">
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.background },
                  }}
                >
                  <Stack.Screen name="(main)" />
                  <Stack.Screen name="settings" options={ROOT_MODAL_SCREEN_OPTIONS} />
                  <Stack.Screen
                    name="player"
                    options={({ route }) => getHiddenPlayerScreenOptions(route.params)}
                  />
                </Stack>
                <AppToastRuntime />
                <AppUpdateSheet />
              </View>
            </RootProviders>
          </HeroUINativeProvider>
        </View>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
