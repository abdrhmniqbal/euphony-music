import React, { useEffect } from "react";
import { View, Text, Pressable, Dimensions, Image, TextInput, Platform } from "react-native";
import { getColors } from "react-native-image-colors";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { $currentTrack, $isPlaying, playNext, playPrevious, togglePlayback, $currentTime, $duration, seekTo } from "@/store/player-store";
import { useIsFavorite, toggleFavoriteItem } from "@/store/favorites-store";
import { $isPlayerExpanded } from "@/store/ui-store";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    useAnimatedProps,
    useAnimatedReaction,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const SCREEN_HEIGHT = Dimensions.get('window').height;
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export const FullPlayer = () => {
    const isExpanded = useStore($isPlayerExpanded);
    const currentTrack = useStore($currentTrack);
    const isPlaying = useStore($isPlaying);
    const currentTimeVal = useStore($currentTime);
    const durationVal = useStore($duration);

    const isCurrentTrackFavorite = useIsFavorite(currentTrack?.id || "");

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const currentTime = formatTime(currentTimeVal);
    const totalTime = formatTime(durationVal);
    const progressPercent = durationVal > 0 ? (currentTimeVal / durationVal) * 100 : 0;

    const translateY = useSharedValue(SCREEN_HEIGHT);

    const [colors, setColors] = React.useState({ bg: '#1a1a1a', primary: '#cccccc', secondary: '#000000' });

    useEffect(() => {
        if (currentTrack?.image) {
            const fetchColors = async () => {
                try {
                    const result = await getColors(currentTrack.image!, {
                        fallback: '#1a1a1a',
                        cache: true,
                        key: currentTrack.image,
                    });

                    if (result.platform === 'android') {
                        setColors({ bg: result.average || '#1a1a1a', primary: result.dominant || '#cccccc', secondary: result.darkVibrant || '#000000' });
                    } else if (result.platform === 'ios') {
                        setColors({ bg: result.background || '#1a1a1a', primary: result.primary || '#cccccc', secondary: result.detail || '#000000' });
                    }
                } catch (e) {
                    console.warn("Failed to extract colors (native module might be missing, try rebuilding):", e);
                }
            };
            fetchColors();
        }
    }, [currentTrack?.image]);

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

    const progress = useSharedValue(0);
    const isSeeking = useSharedValue(false);
    const barWidth = useSharedValue(0);
    const pressed = useSharedValue(false);
    const durationSv = useSharedValue(0);

    useEffect(() => {
        durationSv.value = durationVal;
    }, [durationVal]);

    useEffect(() => {
        if (!isSeeking.value && durationVal > 0) {
            progress.value = currentTimeVal / durationVal;
        }
    }, [currentTimeVal, durationVal]);

    const animatedTextProps = useAnimatedProps(() => {
        const seconds = progress.value * durationSv.value;
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const text = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        return {
            text: text,
        } as any;
    });

    const seekGesture = Gesture.Pan()
        .onStart((e) => {
            isSeeking.value = true;
            pressed.value = true;
            if (barWidth.value > 0) {
                progress.value = Math.max(0, Math.min(1, e.x / barWidth.value));
            }
        })
        .onUpdate((e) => {
            if (barWidth.value > 0) {
                progress.value = Math.max(0, Math.min(1, e.x / barWidth.value));
            }
        })
        .onEnd(() => {
            const seekTime = progress.value * durationVal;
            runOnJS(seekTo)(seekTime);
            isSeeking.value = false;
            pressed.value = false;
        });

    const tapGesture = Gesture.Tap()
        .onStart((e) => {
            isSeeking.value = true;
            pressed.value = true;
            if (barWidth.value > 0) {
                progress.value = Math.max(0, Math.min(1, e.x / barWidth.value));
            }
        })
        .onEnd(() => {
            const seekTime = progress.value * durationVal;
            runOnJS(seekTo)(seekTime);
            isSeeking.value = false;
            pressed.value = false;
        });

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    const barContainerStyle = useAnimatedStyle(() => ({
        height: withTiming(pressed.value ? 12 : 4, { duration: 200 }),
    }));

    const DisplayTime = () => {
        return (
            <View className="flex-row justify-between mt-2">
                <AnimatedTextInput
                    animatedProps={animatedTextProps}
                    className="text-xs text-white/50 p-0 font-variant-numeric-tabular-nums"
                    editable={false}
                    value={currentTime}
                    style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                />
                <Text className="text-xs text-white/50">{totalTime}</Text>
            </View>
        );
    };

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

                        <View className="items-center justify-center flex-1 my-8">
                            <View className="absolute w-full aspect-square bg-purple-500/30 blur-2xl rounded-full scale-0.9" />
                            <View className="w-full aspect-square bg-white rounded-3xl overflow-hidden shadow-2xl elevation-10">
                                {currentTrack.image ? (
                                    <Image
                                        source={{ uri: currentTrack.image }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View className="w-full h-full bg-slate-800 items-center justify-center">
                                        <Ionicons name="musical-note" size={80} color="white" />
                                    </View>
                                )}
                            </View>
                        </View>

                        <View className="flex-row justify-between items-center mb-6">
                            <View className="flex-1 mr-4">
                                <Text className="text-2xl font-bold text-white mb-1" numberOfLines={1}>
                                    {currentTrack.title}
                                </Text>
                                <Text className="text-lg text-white/60" numberOfLines={1}>
                                    {currentTrack.artist || "Unknown Artist"}
                                </Text>
                            </View>
                            <Pressable
                                className="active:opacity-50"
                                onPress={() => {
                                    if (currentTrack) {
                                        toggleFavoriteItem(
                                            currentTrack.id,
                                            'track',
                                            currentTrack.title,
                                            currentTrack.artist,
                                            currentTrack.image
                                        );
                                    }
                                }}
                            >
                                <Ionicons
                                    name={isCurrentTrackFavorite ? "heart" : "heart-outline"}
                                    size={28}
                                    color={isCurrentTrackFavorite ? "#ef4444" : "white"}
                                />
                            </Pressable>
                        </View>

                        <View className="mb-6">
                            <GestureDetector gesture={Gesture.Simultaneous(seekGesture, tapGesture)}>
                                <View
                                    className="py-4"
                                    onLayout={(e) => { barWidth.value = e.nativeEvent.layout.width; }}
                                >
                                    <Animated.View
                                        style={barContainerStyle}
                                        className="w-full bg-white/20 rounded-full overflow-hidden"
                                    >
                                        <Animated.View style={[progressStyle, { backgroundColor: "#FFFFFF" }]} className="h-full rounded-full" />
                                    </Animated.View>
                                </View>
                            </GestureDetector>
                            <DisplayTime />
                        </View>

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

                        <View className="flex-row justify-between items-center px-4">
                            <Pressable className="active:opacity-50">
                                <Ionicons name="chatbubble-outline" size={24} color="white" style={{ opacity: 0.7 }} />
                            </Pressable>
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
