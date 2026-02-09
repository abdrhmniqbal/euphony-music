import React from "react";
import { View, Text, Pressable } from "react-native";
import { useStore } from "@nanostores/react";
import { useThemeColors } from "@/hooks/use-theme-colors";
import Animated, {
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
  useSharedValue,
} from "react-native-reanimated";
import { $indexerState, stopIndexing } from "@/modules/indexer";
import { $currentTrack } from "@/modules/player/player.store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MINI_PLAYER_HEIGHT, getTabBarHeight } from "@/constants/layout";
import { $barsVisible } from "@/hooks/scroll-bars.store";
import { useEffect } from "react";
import { AnimatedProgressBar } from "@/components/organisms/progress/animated-progress";
import LocalLibrarySolidIcon from "./icons/local/library-solid";
import LocalCancelIcon from "./icons/local/cancel";
import LocalCheckmarkCircleSolidIcon from "./icons/local/checkmark-circle-solid";

const PHASE_LABELS: Record<string, string> = {
  idle: "",
  scanning: "Scanning files...",
  processing: "Processing tracks...",
  cleanup: "Cleaning up...",
  complete: "Complete!",
};

const BOTTOM_MARGIN = 16;

export const IndexingProgress: React.FC = () => {
  const theme = useThemeColors();
  const state = useStore($indexerState);
  const currentTrack = useStore($currentTrack);
  const barsVisible = useStore($barsVisible);
  const insets = useSafeAreaInsets();

  const hasMiniPlayer = currentTrack !== null;
  const tabBarHeight = getTabBarHeight(insets.bottom);
  const bottomOffsetVisible =
    tabBarHeight + BOTTOM_MARGIN + (hasMiniPlayer ? MINI_PLAYER_HEIGHT : 0);
  const bottomOffsetHidden = insets.bottom + BOTTOM_MARGIN;
  const targetBottomOffset = barsVisible
    ? bottomOffsetVisible
    : bottomOffsetHidden;
  const animatedBottomOffset = useSharedValue(targetBottomOffset);

  useEffect(() => {
    animatedBottomOffset.value = withTiming(targetBottomOffset, {
      duration: 250,
    });
  }, [animatedBottomOffset, targetBottomOffset]);

  const containerStyle = useAnimatedStyle(() => ({
    bottom: animatedBottomOffset.value,
  }));

  const normalizedProgress = Math.min(Math.max(state.progress / 100, 0), 1);

  if (
    !state.showProgress ||
    (!state.isIndexing && state.phase !== "complete")
  ) {
    return null;
  }

  if (state.phase === "complete") {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        className="absolute left-4 right-4 bg-surface-secondary rounded-2xl p-4 shadow-lg"
        style={containerStyle}
      >
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-accent/20 items-center justify-center">
            <LocalCheckmarkCircleSolidIcon
              width={24}
              height={24}
              color={theme.accent}
            />
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-semibold">
              Library Updated
            </Text>
            <Text className="text-muted text-sm">
              {state.totalFiles} tracks indexed
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      className="absolute left-4 right-4 bg-surface-secondary rounded-2xl p-4 shadow-lg"
      style={containerStyle}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <LocalLibrarySolidIcon width={20} height={20} color={theme.accent} />
          <Text className="text-foreground font-semibold">
            {PHASE_LABELS[state.phase]}
          </Text>
        </View>
        <Pressable
          onPress={stopIndexing}
          className="p-1 active:opacity-50"
          hitSlop={10}
        >
          <LocalCancelIcon width={20} height={20} color={theme.muted} />
        </Pressable>
      </View>

      <AnimatedProgressBar
        progress={normalizedProgress}
        width="100%"
        height={8}
        borderRadius={999}
        progressColor={theme.accent}
        trackColor={`${theme.muted}33`}
        animationDuration={400}
        containerStyle={{ marginBottom: 8 }}
      />

      <View className="flex-row justify-between">
        <Text
          className="text-muted text-xs"
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {state.currentFile || "Preparing..."}
        </Text>
        <Text className="text-muted text-xs ml-2">
          {state.processedFiles}/{state.totalFiles}
        </Text>
      </View>
    </Animated.View>
  );
};
