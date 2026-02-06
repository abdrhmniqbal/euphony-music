import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { MiniPlayer } from "@/components/mini-player";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { useStore } from "@nanostores/react";
import { $barsVisible } from "@/shared/hooks/scroll-bars.store";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";

const TAB_BAR_HEIGHT = 90;

export default function MainLayout() {
    const theme = useThemeColors();
    const barsVisible = useStore($barsVisible);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: withTiming(barsVisible ? 0 : TAB_BAR_HEIGHT + 80, { duration: 250 }),
                },
            ],
        };
    });

    return (
        <Tabs
            tabBar={(props) => (
                <Animated.View
                    style={[
                        animatedStyle,
                        {
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                        },
                    ]}
                >
                    <MiniPlayer />
                    <BottomTabBar {...props} />
                </Animated.View>
            )}
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.foreground,
                tabBarInactiveTintColor: theme.muted,
                tabBarStyle: {
                    backgroundColor: theme.background,
                    borderTopWidth: 1,
                    borderTopColor: theme.divider,
                    height: TAB_BAR_HEIGHT,
                    paddingBottom: 30,
                },
                animation: 'shift',
            }}
        >
            <Tabs.Screen
                name="(home)"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="(search)"
                options={{
                    title: "Search",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="search-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="(library)"
                options={{
                    title: "Library",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="library-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
