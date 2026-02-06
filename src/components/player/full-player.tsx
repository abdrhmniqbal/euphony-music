import React, { useEffect } from "react";
import { View, Dimensions } from "react-native";
import { useStore } from "@nanostores/react";
import { $currentTrack, $isPlaying, $currentTime, $duration } from "@/features/player/player.store";
import { $queue } from "@/features/player/queue.store";
import { $isPlayerExpanded, $showPlayerQueue } from "@/shared/hooks/scroll-bars.store";
import { $currentColors, updateColorsForImage } from "@/features/player/player-colors.store";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { PlayerHeader } from "./player-header";
import { PlayerFooter } from "./player-footer";
import { QueueView } from "./queue-view";
import { AlbumArtView } from "./album-art-view";
import { TrackInfo } from "./track-info";
import { ProgressBar } from "./progress-bar";
import { PlaybackControls } from "./playback-controls";

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const FullPlayer = () => {
    const isExpanded = useStore($isPlayerExpanded);
    const currentTrack = useStore($currentTrack);
    const isPlaying = useStore($isPlaying);
    const currentTimeVal = useStore($currentTime);
    const durationVal = useStore($duration);
    const queue = useStore($queue);
    const showQueue = useStore($showPlayerQueue);
    const colors = useStore($currentColors);

    const translateY = useSharedValue(SCREEN_HEIGHT);
    const scale = useSharedValue(0.9);
    const opacity = useSharedValue(0);

    useEffect(() => {
        updateColorsForImage(currentTrack?.image);
    }, [currentTrack?.image]);

    useEffect(() => {
        if (isExpanded) {
            translateY.value = withTiming(0, { duration: 300 });
            scale.value = withTiming(1, { duration: 350 });
            opacity.value = withTiming(1, { duration: 200 });
        } else {
            translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
            scale.value = withTiming(0.9, { duration: 200 });
            opacity.value = withTiming(0, { duration: 150 });
        }
    }, [isExpanded]);

    const closePlayer = () => {
        $isPlayerExpanded.set(false);
        $showPlayerQueue.set(false);
    };

    const panGesture = Gesture.Pan()
        .activeOffsetY(20)
        .onUpdate((event) => {
            if (event.translationY > 0) {
                translateY.value = event.translationY;
            }
        })
        .onEnd((event) => {
            if (event.translationY > 100 || event.velocityY > 500) {
                runOnJS(closePlayer)();
            } else {
                translateY.value = withTiming(0, { duration: 200 });
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY.value },
                { scale: scale.value }
            ],
            opacity: opacity.value,
        };
    });

    if (!currentTrack) return null;

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View
                style={[
                    animatedStyle,
                    {
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        backgroundColor: 'black',
                        zIndex: 1000,
                    }
                ]}
            >
                <View className="flex-1 relative">
                    <LinearGradient
                        colors={[colors.bg, colors.secondary, '#000000']}
                        locations={[0, 0.6, 1]}
                        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                    />

                    <View className="flex-1 px-6 pt-12 pb-12 justify-between">
                        <PlayerHeader onClose={closePlayer} />

                        {showQueue ? (
                            <QueueView tracks={queue} currentTrack={currentTrack} />
                        ) : (
                            <AlbumArtView currentTrack={currentTrack} />
                        )}

                        <TrackInfo track={currentTrack} compact={showQueue} />

                        <ProgressBar
                            currentTime={currentTimeVal}
                            duration={durationVal}
                            compact={showQueue}
                        />

                        <PlaybackControls isPlaying={isPlaying} compact={showQueue} />

                        <PlayerFooter />
                    </View>
                </View>
            </Animated.View>
        </GestureDetector>
    );
};
