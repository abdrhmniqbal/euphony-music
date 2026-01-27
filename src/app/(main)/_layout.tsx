import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useUniwind } from "uniwind";
import { MiniPlayer } from "@/components/mini-player";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { View } from "react-native";
import { useStore } from "@nanostores/react";
import { $barsVisible } from "@/store/ui-store";
import Animated, { useAnimatedStyle, withTiming, withDelay } from "react-native-reanimated";

export default function MainLayout() {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];
    const barsVisible = useStore($barsVisible);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: withTiming(barsVisible ? 0 : 200, { duration: 300 }),
                },
            ],
        };
    });

    return (
        <Tabs
            tabBar={(props) => (
                <Animated.View style={animatedStyle}>
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
                    height: 90,
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
