import "../global.css";
import { HeroUINativeProvider, ToastProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from "react-native";
import { Stack } from "expo-router";
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Colors } from "@/constants/colors";
import { useUniwind } from "uniwind";
import { useEffect } from "react";

import { FullPlayer } from "@/components/full-player";
import { IndexingProgress } from "@/components/indexing-progress";
import { setupPlayer } from "@/store/player-store";
import { startIndexing, loadTracksFromCache, initLifecycleListeners, cleanupLifecycleListeners } from "@/utils/media-indexer";
import { hasExistingLibrary } from "@/utils/database";

export default function Layout() {
  const { theme: currentTheme } = useUniwind();
  const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];

  useEffect(() => {
    const init = async () => {
      await setupPlayer();

      loadTracksFromCache();

      const hasLibrary = hasExistingLibrary();
      startIndexing(!hasLibrary, !hasLibrary);
    };

    init();
    initLifecycleListeners();

    return () => {
      cleanupLifecycleListeners();
    };
  }, []);

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
            <ToastProvider defaultProps={{
              placement: "bottom"
            }}>
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
                <IndexingProgress />
                <FullPlayer />
              </View>
            </ToastProvider>
          </HeroUINativeProvider>
        </View>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
