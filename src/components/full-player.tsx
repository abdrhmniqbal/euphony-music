import React, { useEffect } from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { $currentTrack, $isPlaying, playNext, playPrevious, togglePlayback } from "@/store/player-store";
import { $isPlayerExpanded } from "@/store/ui-store";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolate
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const FullPlayer = () => {
    const isExpanded = useStore($isPlayerExpanded);
    const currentTrack = useStore($currentTrack);
    const isPlaying = useStore($isPlaying);

    // Mock progress for UI
    const currentTime = "0:08";
    const totalTime = "-3:24";
    const progressPercent = 5;

    const translateY = useSharedValue(SCREEN_HEIGHT);

    useEffect(() => {
        if (isExpanded) {
            translateY.value = withTiming(0, { duration: 300 });
        } else {
            translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
        }
    }, [isExpanded]);

    const closePlayer = () => {
        $isPlayerExpanded.set(false);
    };

    const panGesture = Gesture.Pan()
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
            transform: [{ translateY: translateY.value }],
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
                        backgroundColor: 'black', // fallback
                        zIndex: 1000, // Ensure it covers everything
                    }
                ]}
            >
                <View className="flex-1 relative">
                    <LinearGradient
                        colors={['#4c1d95', '#171717', '#000000']}
                        locations={[0, 0.5, 1]}
                        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                    />

                    <View className="flex-1 px-6 pt-12 pb-12 justify-between">
                        {/* Header */}
                        <View className="flex-row items-center justify-between mt-2 h-10 relative">
                            <Pressable className="p-2 active:opacity-50 z-10 w-12">
                                <Ionicons name="options-outline" size={24} color="white" />
                            </Pressable>

                            <Pressable
                                onPress={closePlayer}
                                className="absolute left-0 right-0 items-center justify-center -top-4 bottom-0 z-0 p-4"
                            >
                                <View className="w-12 h-1.5 bg-white/40 rounded-full" />
                            </Pressable>

                            <View className="flex-row gap-4 z-10">
                                <Pressable className="p-2 active:opacity-50">
                                    <Ionicons name="radio-outline" size={24} color="white" />
                                </Pressable>
                                <Pressable className="p-2 active:opacity-50">
                                    <Ionicons name="ellipsis-horizontal" size={24} color="white" />
                                </Pressable>
                            </View>
                        </View>

                        {/* Album Art Section */}
                        <View className="items-center justify-center flex-1 my-8">
                            <View className="absolute w-full aspect-square bg-purple-500/30 blur-2xl rounded-full scale-0.9" />
                            <View className="w-full aspect-square bg-white rounded-3xl overflow-hidden shadow-2xl elevation-10">
                                <View className="w-full h-full bg-slate-800 items-center justify-center">
                                    <Ionicons name="musical-note" size={80} color="white" />
                                </View>
                            </View>
                        </View>

                        {/* Track Info */}
                        <View className="flex-row justify-between items-center mb-6">
                            <View className="flex-1 mr-4">
                                <Text className="text-2xl font-bold text-white mb-1" numberOfLines={1}>
                                    {currentTrack.title}
                                </Text>
                                <Text className="text-lg text-white/60" numberOfLines={1}>
                                    {currentTrack.subtitle}
                                </Text>
                            </View>
                            <Pressable className="active:opacity-50">
                                <Ionicons name="heart-outline" size={28} color="white" />
                            </Pressable>
                        </View>

                        {/* Progress Bar */}
                        <View className="mb-8">
                            <View className="h-1 w-full bg-white/20 rounded-full mb-2 overflow-hidden">
                                <View style={{ width: `${progressPercent}%` }} className="h-full bg-green-500 rounded-full" />
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-xs text-white/50">{currentTime}</Text>
                                <Text className="text-xs text-white/50">{totalTime}</Text>
                            </View>
                        </View>

                        {/* Controls */}
                        <View className="flex-row justify-between items-center mb-8">
                            <Pressable className="active:opacity-50">
                                <Ionicons name="repeat" size={24} color="white" style={{ opacity: 0.7 }} />
                            </Pressable>

                            <View className="flex-row items-center gap-8">
                                <Pressable onPress={() => playPrevious()} className="active:opacity-50">
                                    <Ionicons name="play-skip-back" size={36} color="white" />
                                </Pressable>

                                <Pressable
                                    className="w-20 h-20 items-center justify-center active:scale-95 transition-transform"
                                    onPress={() => togglePlayback()}
                                >
                                    <Ionicons
                                        name={isPlaying ? "pause-circle" : "play-circle"}
                                        size={80}
                                        color="white"
                                    />
                                </Pressable>

                                <Pressable onPress={() => playNext()} className="active:opacity-50">
                                    <Ionicons name="play-skip-forward" size={36} color="white" />
                                </Pressable>
                            </View>

                            <Pressable className="active:opacity-50">
                                <Ionicons name="shuffle" size={24} color="white" style={{ opacity: 0.7 }} />
                            </Pressable>
                        </View>

                        {/* Bottom Actions */}
                        <View className="flex-row justify-between items-center px-4">
                            <Pressable className="active:opacity-50">
                                <Ionicons name="chatbubble-outline" size={24} color="white" style={{ opacity: 0.7 }} />
                            </Pressable>
                            <View>
                                <Text className="text-white/50 text-[10px] font-medium tracking-widest">MP3 320KBPS</Text>
                            </View>
                            <Pressable className="active:opacity-50">
                                <Ionicons name="list" size={24} color="white" style={{ opacity: 0.7 }} />
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </GestureDetector>
    );
};
