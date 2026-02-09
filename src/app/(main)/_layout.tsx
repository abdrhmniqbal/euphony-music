import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { MiniPlayer } from "@/components/mini-player";
import {
  BottomTabBar,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { useStore } from "@nanostores/react";
import { $barsVisible } from "@/hooks/scroll-bars.store";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useEffect } from "react";
import {
  MINI_PLAYER_HEIGHT,
  getTabBarBottomPadding,
  getTabBarHeight,
} from "@/constants/layout";
import LocalHomeIcon from "@/components/icons/local/home";
import LocalHomeSolidIcon from "@/components/icons/local/home-solid";
import LocalSearchSolidIcon from "@/components/icons/local/search-solid";
import LocalSearchIcon from "@/components/icons/local/search";
import LocalLibrarySolidIcon from "@/components/icons/local/library-solid";
import LocalLibraryIcon from "@/components/icons/local/library";

const TAB_HIDE_DURATION_MS = 250;
const TAB_HIDE_EXTRA_OFFSET = 16;

export default function MainLayout() {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const barsVisible = useStore($barsVisible);
  const tabBarBottomPadding = getTabBarBottomPadding(insets.bottom);
  const tabBarHeight = getTabBarHeight(insets.bottom);
  const hiddenOffset =
    tabBarHeight + MINI_PLAYER_HEIGHT + TAB_HIDE_EXTRA_OFFSET;
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(barsVisible ? 0 : hiddenOffset, {
      duration: TAB_HIDE_DURATION_MS,
    });
  }, [barsVisible, hiddenOffset, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: translateY.value,
        },
      ],
    };
  });

  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => {
      return (
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
      );
    },
    [animatedStyle, tabBarHeight],
  );

  return (
    <Tabs
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.foreground,
        tabBarInactiveTintColor: theme.muted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 1,
          borderTopColor: theme.divider,
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
          title: "Home",
          tabBarIcon: ({ color, size, focused }) =>
            focused ? (
              <LocalHomeSolidIcon color={color} width={size} height={size} />
            ) : (
              <LocalHomeIcon color={color} width={size} height={size} />
            ),
        }}
      />
      <Tabs.Screen
        name="(search)"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size, focused }) =>
            focused ? (
              <LocalSearchSolidIcon color={color} width={size} height={size} />
            ) : (
              <LocalSearchIcon color={color} width={size} height={size} />
            ),
        }}
      />
      <Tabs.Screen
        name="(library)"
        options={{
          title: "Library",
          tabBarIcon: ({ color, size, focused }) =>
            focused ? (
              <LocalLibrarySolidIcon color={color} width={size} height={size} />
            ) : (
              <LocalLibraryIcon color={color} width={size} height={size} />
            ),
        }}
      />
    </Tabs>
  );
}
