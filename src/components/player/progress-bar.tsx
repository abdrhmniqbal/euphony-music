import React, { useEffect } from "react";
import { View, Text, TextInput } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedProps,
    withTiming,
    runOnJS,
    Layout,
    SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { seekTo } from "@/features/player/player.store";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface ProgressBarProps {
    currentTime: number;
    duration: number;
    compact?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentTime, duration, compact = false }) => {
    const progress = useSharedValue(0);
    const isSeeking = useSharedValue(false);
    const barWidth = useSharedValue(0);
    const pressed = useSharedValue(false);
    const durationSv = useSharedValue(0);

    useEffect(() => {
        durationSv.value = duration;
    }, [duration]);

    useEffect(() => {
        if (!isSeeking.value && duration > 0) {
            progress.value = currentTime / duration;
        }
    }, [currentTime, duration]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

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
            const seekTime = progress.value * duration;
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
            const seekTime = progress.value * duration;
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

    return (
        <Animated.View
            layout={Layout.duration(300)}
            className={compact ? 'mb-4' : 'mb-6'}
        >
            <GestureDetector gesture={Gesture.Simultaneous(seekGesture, tapGesture)}>
                <View
                    className={compact ? 'py-2' : 'py-4'}
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
            <View className="flex-row justify-between mt-2">
                <AnimatedTextInput
                    animatedProps={animatedTextProps}
                    className="text-xs text-white/50 p-0 font-variant-numeric-tabular-nums"
                    editable={false}
                    value={formatTime(currentTime)}
                    style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                />
                <Text className="text-xs text-white/50">{formatTime(duration)}</Text>
            </View>
        </Animated.View>
    );
};
