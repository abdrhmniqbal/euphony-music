import { useCallback, useEffect, type ReactNode } from "react"
import { useStore } from "@nanostores/react"
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native"
import { Stack, useSegments } from "expo-router"
import { HeroUINativeProvider } from "heroui-native"
import { View } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useUniwind } from "uniwind"

import { MINI_PLAYER_HEIGHT, getTabBarHeight } from "@/constants/layout"
import { $barsVisible } from "@/hooks/scroll-bars.store"
import { useThemeColors } from "@/hooks/use-theme-colors"
import { useAppBootstrap } from "@/modules/bootstrap/hooks/use-app-bootstrap"
import { $currentTrack } from "@/modules/player/player.store"
import { FullPlayer } from "@/components/blocks/full-player"
import { IndexingProgress } from "@/components/blocks/indexing-progress"
import { Providers } from "@/components/providers"

import "../global.css"

const TOAST_OFFSET_ANIMATION_DURATION_MS = 250
const TOAST_HIDDEN_BOTTOM_GAP = 0
const TOAST_VISIBLE_BOTTOM_GAP = 0

function ToastAnimatedWrapper({
  children,
  extraBottom,
}: {
  children: ReactNode
  extraBottom: number
}) {
  const animatedExtraBottom = useSharedValue(extraBottom)

  useEffect(() => {
    animatedExtraBottom.value = withTiming(extraBottom, {
      duration: TOAST_OFFSET_ANIMATION_DURATION_MS,
    })
  }, [animatedExtraBottom, extraBottom])

  const animatedStyle = useAnimatedStyle(() => ({
    paddingBottom: animatedExtraBottom.value,
  }))

  return (
    <Animated.View
      style={[{ flex: 1 }, animatedStyle]}
      pointerEvents="box-none"
    >
      {children}
    </Animated.View>
  )
}

export default function Layout() {
  const { theme: currentTheme } = useUniwind()
  const theme = useThemeColors()
  const segments = useSegments()
  const insets = useSafeAreaInsets()
  const barsVisible = useStore($barsVisible)
  const currentTrack = useStore($currentTrack)
  useAppBootstrap()
  const tabBarHeight = getTabBarHeight(insets.bottom)
  const hasMiniPlayer = currentTrack !== null
  const isMainTabsRoute = segments[0] === "(main)"
  const toastExtraBottomOffset = isMainTabsRoute
    ? barsVisible
      ? tabBarHeight +
        (hasMiniPlayer ? MINI_PLAYER_HEIGHT : 0) +
        TOAST_VISIBLE_BOTTOM_GAP
      : TOAST_HIDDEN_BOTTOM_GAP
    : TOAST_HIDDEN_BOTTOM_GAP

  const toastContentWrapper = useCallback(
    (children: ReactNode) => {
      return (
        <ToastAnimatedWrapper extraBottom={toastExtraBottomOffset}>
          {children}
        </ToastAnimatedWrapper>
      )
    },
    [toastExtraBottomOffset]
  )

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
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ThemeProvider value={navigationTheme}>
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <HeroUINativeProvider
            config={{
              devInfo: { stylingPrinciples: false },
              toast: {
                defaultProps: {
                  placement: "bottom",
                },
                contentWrapper: toastContentWrapper,
              },
            }}
          >
            <Providers>
              <View className="flex-1">
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.background },
                  }}
                >
                  <Stack.Screen name="(main)" />
                  <Stack.Screen
                    name="search-interaction"
                    options={{
                      animation: "default",
                      title: "Search",
                    }}
                  />
                  <Stack.Screen
                    name="settings"
                    options={{
                      headerShown: false,
                      presentation: "modal",
                      animation: "slide_from_bottom",
                    }}
                  />
                </Stack>
                <IndexingProgress />
                <FullPlayer />
              </View>
            </Providers>
          </HeroUINativeProvider>
        </View>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
