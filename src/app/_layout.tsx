import "../global.css";
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from "react-native";
import { Stack } from "expo-router";
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Colors } from "@/constants/colors";
import { useUniwind } from "uniwind";

import { FullPlayer } from "@/components/full-player";

export default function Layout() {
  const { theme: currentTheme } = useUniwind();
  const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];

  const navigationTheme = {
    ...(currentTheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(currentTheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.background,
      text: theme.foreground,
      border: theme.divider,
      notification: theme.accent,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <ThemeProvider value={navigationTheme}>
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
            <View className="flex-1">
              <Stack screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.background },
              }}>
                <Stack.Screen name="(main)" />
                <Stack.Screen
                  name="search-interaction"
                  options={{
                    animation: 'fade',
                    title: 'Search',
                  }}
                />
                <Stack.Screen
                  name="settings"
                  options={{
                    headerShown: false,
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }}
                />
              </Stack>
              <FullPlayer />
            </View>
          </HeroUINativeProvider>
        </View>
      </ThemeProvider>
    </GestureHandlerRootView >
  );
}
