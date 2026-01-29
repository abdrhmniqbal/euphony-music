import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useStore } from '@nanostores/react';
import { useUniwind } from 'uniwind';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    withSpring,
    FadeIn,
    FadeOut
} from 'react-native-reanimated';
import { $indexerState, stopIndexing } from '@/utils/media-indexer';
import { $currentTrack } from '@/store/player-store';

const PHASE_LABELS: Record<string, string> = {
    idle: '',
    scanning: 'Scanning files...',
    processing: 'Processing tracks...',
    cleanup: 'Cleaning up...',
    complete: 'Complete!',
};

const MINI_PLAYER_HEIGHT = 80;
const TAB_BAR_HEIGHT = 80;
const BOTTOM_MARGIN = 16;

export const IndexingProgress: React.FC = () => {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];
    const state = useStore($indexerState);
    const currentTrack = useStore($currentTrack);

    const hasMiniPlayer = currentTrack !== null;
    const bottomOffset = TAB_BAR_HEIGHT + BOTTOM_MARGIN + (hasMiniPlayer ? MINI_PLAYER_HEIGHT : 0);

    const progressStyle = useAnimatedStyle(() => ({
        width: withSpring(`${state.progress}%`, {
            damping: 15,
            stiffness: 100,
        }),
    }));

    if (!state.showProgress || (!state.isIndexing && state.phase !== 'complete')) {
        return null;
    }

    if (state.phase === 'complete') {
        return (
            <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                className="absolute left-4 right-4 bg-surface-secondary rounded-2xl p-4 shadow-lg"
                style={{ bottom: bottomOffset }}
            >
                <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-accent/20 items-center justify-center">
                        <Ionicons name="checkmark" size={24} color={theme.accent} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-foreground font-semibold">Library Updated</Text>
                        <Text className="text-muted text-sm">{state.totalFiles} tracks indexed</Text>
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
            style={{ bottom: bottomOffset }}
        >
            <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                    <Ionicons name="library-outline" size={20} color={theme.accent} />
                    <Text className="text-foreground font-semibold">
                        {PHASE_LABELS[state.phase]}
                    </Text>
                </View>
                <Pressable
                    onPress={stopIndexing}
                    className="p-1 active:opacity-50"
                    hitSlop={10}
                >
                    <Ionicons name="close" size={20} color={theme.muted} />
                </Pressable>
            </View>

            <View className="h-2 bg-muted/20 rounded-full overflow-hidden mb-2">
                <Animated.View
                    style={progressStyle}
                    className="h-full bg-accent rounded-full"
                />
            </View>

            <View className="flex-row justify-between">
                <Text className="text-muted text-xs" numberOfLines={1} style={{ flex: 1 }}>
                    {state.currentFile || 'Preparing...'}
                </Text>
                <Text className="text-muted text-xs ml-2">
                    {state.processedFiles}/{state.totalFiles}
                </Text>
            </View>
        </Animated.View>
    );
};
