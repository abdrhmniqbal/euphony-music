/**
 * Purpose: Boots the app shell, sets navigation theme, handles notifications, and defines the root stack.
 * Caller: Expo Router root entry point.
 * Dependencies: RootProviders, bootstrap runtime, notification runtime, update runtime, HeroUI Native, Expo Router stack options, player UI state.
 * Main Functions: Layout()
 * Side Effects: Starts notification runtime, drives splash-screen visibility, triggers bootstrap lifecycle, routes into player/settings screens.
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation"
import { useSegments } from "expo-router"
import { useGuardedRouter as useRouter } from "@/modules/navigation"
import * as SplashScreen from "expo-splash-screen"
import { HeroUINativeProvider } from "heroui-native"
import { type ReactNode, useEffect, useRef } from "react"
import { View } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useUniwind, ScopedTheme } from "uniwind"

import { RootProviders } from "@/modules/shared/components/providers/root-providers"
import { AppUpdateSheet } from "@/modules/updates/ui/app-update-sheet"
import { AppToastRuntime } from "@/modules/shared/components/providers/app-toast-runtime"
import { getTabBarHeight, MINI_PLAYER_HEIGHT } from "@/modules/shared/constants/layout"
import { Stack } from "@/modules/shared/layouts/stack"
import {
  handleBootstrapDatabaseError,
  handleBootstrapDatabaseReady,
} from "@/modules/bootstrap/runtime"
import { checkStartupAppUpdate } from "@/modules/updates/app-update-runtime"
import { ROOT_MODAL_SCREEN_OPTIONS, getHiddenPlayerScreenOptions } from "@/modules/navigation"
import {
  ensureNotificationRuntimeStarted,
  markRouterReady,
  setNotificationRouteHandler,
} from "@/modules/notifications/notification-runtime"
import { useHasCurrentTrack } from "@/modules/player/selectors"
import { useThemeColors } from "@/modules/ui/theme"
import { getAppThemeDefinition } from "@/modules/ui/theme-registry"
import { useUIStore } from "@/modules/ui/store"
import { useSettingsStore } from "@/modules/settings/store"
import { usePreferenceStore } from "@/stores/preference/store"

import "../global.css"

const TOAST_OFFSET_ANIMATION_DURATION_MS = 250
const TOAST_HIDDEN_BOTTOM_GAP = 0
const TOAST_VISIBLE_BOTTOM_GAP = 0
const SETTINGS_FOLDER_FILTERS_ACTION_HEIGHT = 56
const SETTINGS_FOLDER_FILTERS_ACTION_TOP_PADDING = 12

type ScopedThemeName =
  | "theme-default-light"
  | "theme-default-dark"
  | "theme-nord-light"
  | "theme-nord-dark"
  | "theme-dracula-light"
  | "theme-dracula-dark"
  | "theme-catppuccin-light"
  | "theme-catppuccin-dark"
  | "theme-tokyo-dark"
  | "theme-tokyo-light"
  | "theme-gruvbox-light"
  | "theme-gruvbox-dark"
  | "theme-everforest-light"
  | "theme-everforest-dark"
  | "theme-rose-pine-light"
  | "theme-rose-pine-dark"
  | "theme-solarized-light"
  | "theme-solarized-dark"
  | "theme-ayu-light"
  | "theme-ayu-dark"
  | "theme-monochrome-light"
  | "theme-monochrome-dark"
  | "theme-aquamarine-light"
  | "theme-aquamarine-dark"
  | "theme-crimson-pulse-light"
  | "theme-crimson-pulse-dark"
  | "theme-banana-breeze-light"
  | "theme-banana-breeze-dark"
  | "theme-candy-pop-light"
  | "theme-candy-pop-dark"

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

function ThemedAppShell({
  currentTheme,
  notifyDatabaseReady,
  notifyDatabaseError,
  toastExtraBottomOffset,
}: {
  currentTheme: string
  notifyDatabaseReady: () => Promise<void>
  notifyDatabaseError: () => void
  toastExtraBottomOffset: number
}) {
  const theme = useThemeColors()
  const isDark = currentTheme === "dark" || currentTheme.endsWith("-dark")
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
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
                  <Stack.Screen name="onboarding" />
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

export default function Layout() {
  const router = useRouter()
  const { theme: currentTheme } = useUniwind()
  const segments = useSegments()
  const themeId = useSettingsStore((state) => state.themeConfig.themeId)
  const insets = useSafeAreaInsets()
  const barsVisible = useUIStore((state) => state.barsVisible)
  const hasMiniPlayer = useHasCurrentTrack()
  const hasHiddenSplashRef = useRef(false)
  const routerRef = useRef(router)
  routerRef.current = router

  // Register the notification route handler once on mount, before the async
  // bootstrap marks the router ready. Using a ref keeps the latest router
  // without re-running on every render (the previous render-body registration
  // ran on every render; a [router] effect re-registered on router identity
  // changes and delayed handler setup past markRouterReady, which left
  // notification taps unhandled and corrupted player restore state).
  useEffect(() => {
    setNotificationRouteHandler((route) => {
      const activeRouter = routerRef.current
      if (!activeRouter.canGoBack() && route !== "/(main)/(home)") {
        activeRouter.replace("/(main)/(home)")
      }
      activeRouter.push(route as never)
    })
    ensureNotificationRuntimeStarted()
  }, [])

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
    markRouterReady()
    void checkStartupAppUpdate()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        hideSplash()
      })
    })
  }
  const notifyDatabaseError = () => {
    handleBootstrapDatabaseError()
    markRouterReady()
    hideSplash()
  }
  const completedOnboarding = usePreferenceStore((state) => state.completedOnboarding)
  const isHydrated = usePreferenceStore((state) => state._hasHydrated)

  useEffect(() => {
    if (isHydrated && !completedOnboarding) {
      router.replace("/onboarding")
    }
  }, [isHydrated, completedOnboarding, router])

  const appTheme = getAppThemeDefinition(themeId)
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

  const isDark = currentTheme === "dark" || currentTheme.endsWith("-dark")
  const activeThemeName = (
    isDark ? `${appTheme.rootClassName}-dark` : `${appTheme.rootClassName}-light`
  ) as ScopedThemeName

  return (
    <ScopedTheme theme={activeThemeName}>
      <ThemedAppShell
        currentTheme={currentTheme}
        notifyDatabaseReady={notifyDatabaseReady}
        notifyDatabaseError={notifyDatabaseError}
        toastExtraBottomOffset={toastExtraBottomOffset}
      />
    </ScopedTheme>
  )
}
