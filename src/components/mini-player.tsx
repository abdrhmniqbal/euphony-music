import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@nanostores/react';
import { $currentTrack, $isPlaying, $currentTime, $duration, togglePlayback } from '@/store/player-store';
import { useThemeColors } from '@/hooks/use-theme-colors';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { $isPlayerExpanded, $showPlayerQueue } from '@/store/ui-store';
import { MarqueeText } from './marquee-text';

export const MiniPlayer = () => {
    const currentTrack = useStore($currentTrack);
    const isPlaying = useStore($isPlaying);
    const currentTime = useStore($currentTime);
    const duration = useStore($duration);

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    const theme = useThemeColors();

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
                <View className="absolute top-0 left-0 right-0 h-[2px] bg-default/20">
                    <View
                        style={{
                            width: `${progressPercent}%`,
                            height: '100%',
                            backgroundColor: theme.accent
                        }}
                    />
                </View>

                <View className="flex-1 flex-row items-center px-4 gap-3">
                    <View
                        className="w-11 h-11 rounded-md bg-default items-center justify-center overflow-hidden"
                    >
                        {currentTrack.image ? (
                            <Image
                                source={{ uri: currentTrack.image }}
                                className="w-full h-full"
                            />
                        ) : (
                            <Ionicons name="musical-note" size={20} color={theme.foreground} />
                        )}
                    </View>

                    <View className="flex-1 overflow-hidden">
                        <MarqueeText
                            text={currentTrack.title}
                            className="text-[15px] font-bold text-foreground"
                            speed={0.6}
                        />
                        <MarqueeText
                            text={currentTrack.artist || 'Unknown Artist'}
                            className="text-[13px] text-muted"
                            speed={0.5}
                        />
                    </View>

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
                        <Pressable
                            onPress={(e) => {
                                e.stopPropagation();
                                $showPlayerQueue.set(true);
                                $isPlayerExpanded.set(true);
                            }}
                            className="active:opacity-60"
                        >
                            <Ionicons name="list-sharp" size={22} color={theme.muted} />
                        </Pressable>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};
