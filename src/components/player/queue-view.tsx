import React from "react";
import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { Track, playTrack } from "@/features/player/player.store";
import { useStore } from "@nanostores/react";
import { $queueInfo, removeFromQueue } from "@/features/player/queue.store";

interface QueueItemProps {
    track: Track;
    isCurrentTrack: boolean;
    onPress: () => void;
    onRemove: () => void;
}

export const QueueItem: React.FC<QueueItemProps> = ({ track, isCurrentTrack, onPress, onRemove }) => (
    <Pressable
        onPress={onPress}
        className={`flex-row items-center py-3 px-2 rounded-xl ${isCurrentTrack ? 'bg-white/10' : 'active:bg-white/5'
            }`}
    >
        <View className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${isCurrentTrack ? 'border-white/60' : 'border-white/20'
            }`}>
            {isCurrentTrack && (
                <View className="w-2.5 h-2.5 rounded-full bg-white" />
            )}
        </View>

        <View className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 mr-3">
            {track.image ? (
                <Image
                    source={{ uri: track.image }}
                    className="w-full h-full"
                    resizeMode="cover"
                />
            ) : (
                <View className="w-full h-full items-center justify-center">
                    <Ionicons name="musical-note" size={20} color="white" />
                </View>
            )}
        </View>

        <View className="flex-1 justify-center">
            <Text
                className={`font-bold text-base ${isCurrentTrack ? 'text-white' : 'text-white/90'
                    }`}
                numberOfLines={1}
            >
                {track.title}
            </Text>
            <Text className="text-white/50 text-sm" numberOfLines={1}>
                {track.artist || "Unknown Artist"}
            </Text>
        </View>

        {!isCurrentTrack && (
            <Pressable onPress={onRemove} className="p-2 active:opacity-50">
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.5)" />
            </Pressable>
        )}

        <View className="ml-1">
            <Ionicons name="reorder-three" size={24} color="rgba(255,255,255,0.4)" />
        </View>
    </Pressable>
);

interface QueueViewProps {
    tracks: Track[];
    currentTrack: Track | null;
}

export const QueueView: React.FC<QueueViewProps> = ({ currentTrack }) => {
    const queueInfo = useStore($queueInfo);
    const { queue, upNext } = queueInfo;

    if (!currentTrack || queue.length === 0) return null;

    const handleRemove = async (trackId: string) => {
        await removeFromQueue(trackId);
    };

    return (
        <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            layout={Layout.duration(300)}
            className="flex-1 my-3 -mx-2 overflow-hidden"
        >
            <View className="mb-2 px-2 flex-row justify-between items-center">
                <Text className="text-white/60 text-sm">
                    Up Next • {upNext.length} {upNext.length === 1 ? 'song' : 'songs'}
                </Text>
            </View>
            <View className="flex-1 h-0">
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    <View className="gap-1">
                        {queue.map((track) => (
                            <QueueItem
                                key={track.id}
                                track={track}
                                isCurrentTrack={track.id === currentTrack.id}
                                onPress={() => playTrack(track, queue)}
                                onRemove={() => handleRemove(track.id)}
                            />
                        ))}
                    </View>
                </ScrollView>
            </View>
        </Animated.View>
    );
};
