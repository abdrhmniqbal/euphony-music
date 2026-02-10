import React from "react";
import { View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { Track } from "@/modules/player/player.store";

interface AlbumArtViewProps {
    currentTrack: Track;
}

export const AlbumArtView: React.FC<AlbumArtViewProps> = ({ currentTrack }) => (
    <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        layout={Layout.duration(300)}
        className="items-center justify-center flex-1 my-8"
    >
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
    </Animated.View>
);
