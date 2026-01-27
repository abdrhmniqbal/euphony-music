import React from "react";
import { View, Text, Image, Pressable, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import { useStore } from "@nanostores/react";
import { $currentTrack, $isPlaying, $progress, togglePlayback, playNext, playPrevious } from "@/store/player-store";


import { LinearGradient } from 'expo-linear-gradient';

export default function PlayerScreen() {
    const router = useRouter();
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];

    // Player State
    const currentTrack = useStore($currentTrack);
    const isPlaying = useStore($isPlaying);
    // Mock progress for UI if store doesn't provide enough detail
    const currentTime = "0:08";
    const totalTime = "-3:24";
    const progressPercent = 5; // 5%

    if (!currentTrack) {
        // Fallback if accessed directly without track
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <Text className="text-foreground">No track playing</Text>
                <Pressable onPress={() => router.back()} className="mt-4 p-2">
                    <Text className="text-accent">Go back</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background relative">

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
                        onPress={() => router.back()}
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
                    {/* Shadow/Glow behind album art */}
                    <View className="absolute w-full aspect-square bg-purple-500/30 blur-2xl rounded-full scale-0.9" />

                    <View className="w-full aspect-square bg-white rounded-3xl overflow-hidden shadow-2xl elevation-10">
                        {/* Placeholder generic art if no image source (mocking logic) */}
                        <View className="w-full h-full bg-slate-800 items-center justify-center">
                            <Ionicons name="musical-note" size={80} color="white" />
                        </View>
                        {/* Real image would go here: <Image source={{ uri: ... }} className="w-full h-full" /> */}
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
    );
}
