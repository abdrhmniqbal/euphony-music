import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { useStore } from '@nanostores/react';
import { $currentTrack, $currentTime } from '@/modules/player/player.store';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SyncedLyrics = ({ isVisible }: { isVisible: boolean }) => {
    const currentTrack = useStore($currentTrack);
    const currentTime = useStore($currentTime);
    const scrollViewRef = useRef<ScrollView>(null);

    const lyrics = currentTrack?.lyrics || [];

    // Find active line index
    const activeLineIndex = lyrics.findIndex((line, index) => {
        const nextLine = lyrics[index + 1];
        return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
    });

    useEffect(() => {
        if (activeLineIndex !== -1 && isVisible) {
            scrollViewRef.current?.scrollTo({
                y: activeLineIndex * 60 - SCREEN_HEIGHT / 4,
                animated: true,
            });
        }
    }, [activeLineIndex, isVisible]);

    if (!isVisible) return null;

    return (
        <View className="flex-1 px-4 my-4">
            <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: SCREEN_HEIGHT / 3 }}
            >
                {lyrics.length === 0 ? (
                    <Text className="text-white/40 text-center text-lg italic">
                        No lyrics available for this track
                    </Text>
                ) : (
                    lyrics.map((line, index) => (
                        <View
                            key={index}
                            style={{ height: 60 }}
                            className="justify-center items-center"
                        >
                            <Text
                                className={`text-2xl font-bold text-center px-4 transition-all duration-300 ${index === activeLineIndex
                                        ? 'text-white opacity-100 scale-110'
                                        : 'text-white/30 opacity-50 scale-100'
                                    }`}
                            >
                                {line.text}
                            </Text>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};
