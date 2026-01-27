import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@nanostores/react';
import { $currentTrack, $isPlaying, $progress, togglePlayback } from '@/store/player-store';
import { useUniwind } from 'uniwind';
import { Colors } from '@/constants/colors';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { $isPlayerExpanded } from '@/store/ui-store';

export const MiniPlayer = () => {
    const currentTrack = useStore($currentTrack);
    const isPlaying = useStore($isPlaying);
    const progress = useStore($progress);

    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];

    if (!currentTrack) return null;

    return (
        <Animated.View
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(300)}
            className="absolute left-0 right-0 h-[64px] border-t border-divider overflow-hidden bg-surface-secondary"
            style={{
                bottom: 90,
                borderTopColor: theme.divider
            }}
        >
            <Pressable className="flex-1" onPress={() => $isPlayerExpanded.set(true)}>
                {/* Progress Bar */}
                <View className="absolute top-0 left-0 right-0 h-[2px] bg-default/20">
                    <View
                        style={{
                            width: `${progress * 100}%`,
                            height: '100%',
                            backgroundColor: theme.accent
                        }}
                    />
                </View>

                <View className="flex-1 flex-row items-center px-4 gap-3">
                    {/* Album Art Placeholder */}
                    <View
                        className="w-11 h-11 rounded-md bg-default items-center justify-center overflow-hidden"
                    >
                        <Ionicons name="musical-note" size={20} color={theme.foreground} />
                    </View>

                    {/* Track Info */}
                    <View className="flex-1">
                        <Text className="text-[15px] font-bold text-foreground" numberOfLines={1}>
                            {currentTrack.title}
                        </Text>
                        <Text className="text-[13px] text-muted" numberOfLines={1}>
                            {currentTrack.subtitle}
                        </Text>
                    </View>

                    {/* Controls */}
                    <View className="flex-row items-center gap-5">
                        <Pressable onPress={(e) => { e.stopPropagation(); togglePlayback(); }} className="active:opacity-60">
                            <Ionicons
                                name={isPlaying ? "pause-sharp" : "play-sharp"}
                                size={28}
                                color={theme.foreground}
                            />
                        </Pressable>
                        <Pressable onPress={(e) => e.stopPropagation()} className="active:opacity-60">
                            <Ionicons name="play-skip-forward-sharp" size={24} color={theme.foreground} />
                        </Pressable>
                        <Pressable onPress={(e) => e.stopPropagation()} className="active:opacity-60">
                            <Ionicons name="list-sharp" size={22} color={theme.muted} />
                        </Pressable>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};
