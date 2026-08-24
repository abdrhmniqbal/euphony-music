import type { BottomTabBarProps } from "expo-router/js-tabs"
import { BottomTabBar } from "expo-router/js-tabs"
import { Tabs } from "expo-router"
import { useTranslation } from "react-i18next"
import { useThemeColor } from "heroui-native"
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import LocalHome09Icon from "@/components/icons/local/home-09"
import LocalHome09SolidIcon from "@/components/icons/local/home-09-solid"
import LocalLibraryIcon from "@/components/icons/local/library"
import LocalLibrarySolidIcon from "@/components/icons/local/library-solid"
import LocalSearch01Icon from "@/components/icons/local/search-01"
import LocalSearch01SolidIcon from "@/components/icons/local/search-01-solid"
import { useUIStore } from "@/core/ui/store"
import { getTabBarBottomPadding, getTabBarHeight, MINI_PLAYER_HEIGHT } from "@/lib/layout"
import { MiniPlayer } from "@/components/blocks/player/mini-player"

const TAB_HIDE_DURATION_MS = 250
const TAB_HIDE_EXTRA_OFFSET = 16

export default function MainLayout() {
  const [foreground, mutedColor, background, borderColor] = useThemeColor([
    "foreground",
    "muted",
    "background",
    "border",
  ])
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const barsVisible = useUIStore((state) => state.barsVisible)
  const tabBarBottomPadding = getTabBarBottomPadding(insets.bottom)
  const tabBarHeight = getTabBarHeight(insets.bottom)
  const hiddenOffset = tabBarHeight + MINI_PLAYER_HEIGHT + TAB_HIDE_EXTRA_OFFSET
  const translateY = useDerivedValue(() => {
    return withTiming(barsVisible ? 0 : hiddenOffset, {
      duration: TAB_HIDE_DURATION_MS,
    })
  }, [barsVisible, hiddenOffset])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: translateY.value,
        },
      ],
    }
  })

  return (
    <Tabs
      tabBar={(props: BottomTabBarProps) => (
        <Animated.View
          pointerEvents="box-none"
          style={[
            animatedStyle,
            {
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
            },
          ]}
        >
          <MiniPlayer bottomOffset={tabBarHeight} />
          <BottomTabBar {...props} />
        </Animated.View>
      )}
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: foreground,
        tabBarInactiveTintColor: mutedColor,
        tabBarHideOnKeyboard: true,
        freezeOnBlur: false,
        sceneStyle: {
          backgroundColor: background,
        },
        tabBarStyle: {
          backgroundColor: background,
          borderTopWidth: 1,
          borderTopColor: borderColor,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: tabBarBottomPadding,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600" as const,
        },
        animation: "shift",
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: t("navigation.tabs.home"),
          tabBarIcon: ({ color, size, focused }) =>
            focused ? (
              <LocalHome09SolidIcon fill="none" color={color} width={size} height={size} />
            ) : (
              <LocalHome09Icon fill="none" color={color} width={size} height={size} />
            ),
        }}
      />
      <Tabs.Screen
        name="(search)"
        options={{
          title: t("navigation.tabs.search"),
          tabBarIcon: ({ color, size, focused }) =>
            focused ? (
              <LocalSearch01SolidIcon fill="none" color={color} width={size} height={size} />
            ) : (
              <LocalSearch01Icon fill="none" color={color} width={size} height={size} />
            ),
        }}
      />
      <Tabs.Screen
        name="(library)"
        options={{
          title: t("navigation.tabs.library"),
          popToTopOnBlur: true,
          tabBarIcon: ({ color, size, focused }) =>
            focused ? (
              <LocalLibrarySolidIcon fill="none" color={color} width={size} height={size} />
            ) : (
              <LocalLibraryIcon fill="none" color={color} width={size} height={size} />
            ),
        }}
      />
    </Tabs>
  )
}
