import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { Layout } from "react-native-reanimated";
import { Track } from "@/features/player/player.store";
import { toggleFavoriteItem } from "@/features/favorites/favorites.store";
import { useIsFavorite } from "@/features/favorites/favorites.store";

interface TrackInfoProps {
    track: Track;
    compact?: boolean;
}

export const TrackInfo: React.FC<TrackInfoProps> = ({ track, compact = false }) => {
    const isFavorite = useIsFavorite(track.id);

    return (
        <Animated.View
            layout={Layout.duration(300)}
            className={`flex-row justify-between items-center ${compact ? 'mb-3' : 'mb-6'}`}
        >
            <View className="flex-1 mr-4">
                <Text className={`font-bold text-white mb-1 ${compact ? 'text-xl' : 'text-2xl'}`} numberOfLines={1}>
                    {track.title}
                </Text>
                <Text className={`text-white/60 ${compact ? 'text-base' : 'text-lg'}`} numberOfLines={1}>
                    {track.artist || "Unknown Artist"}
                </Text>
            </View>
            <Pressable
                className="active:opacity-50"
                onPress={() => {
                    toggleFavoriteItem(
                        track.id,
                        'track',
                        track.title,
                        track.artist,
                        track.image
                    );
                }}
            >
                <Ionicons
                    name={isFavorite ? "heart" : "heart-outline"}
                    size={compact ? 24 : 28}
                    color={isFavorite ? "#ef4444" : "white"}
                />
            </Pressable>
        </Animated.View>
    );
};
