import React, { useEffect, useState } from "react";
import { View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet, Button } from "heroui-native";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { playTrack, Track } from "@/modules/player/player.store";
import { playNext, addToQueue } from "@/modules/player/queue.store";
import { toggleFavoriteItem } from "@/modules/favorites/favorites.store";

interface TrackActionSheetProps {
    track: Track | null;
    isOpen: boolean;
    onClose: () => void;
    tracks?: Track[];
    onAddToPlaylist?: (track: Track) => void;
}

export const TrackActionSheet: React.FC<TrackActionSheetProps> = ({
    track,
    isOpen,
    onClose,
    tracks,
    onAddToPlaylist,
}) => {
    const theme = useThemeColors();
    const [isFavorite, setIsFavorite] = useState(track?.isFavorite || false);

    useEffect(() => {
        setIsFavorite(track?.isFavorite || false);
    }, [track?.id, track?.isFavorite]);

    const handlePlay = async () => {
        if (track) {
            playTrack(track, tracks);
            onClose();
        }
    };

    const handleToggleFavorite = () => {
        if (track) {
            const newState = !isFavorite;
            setIsFavorite(newState);
            toggleFavoriteItem(track.id, 'track', track.title, track.artist, track.image);
        }
    };

    const handlePlayNext = async () => {
        if (track) {
            await playNext(track);
            onClose();
        }
    };

    const handleAddToQueue = async () => {
        if (track) {
            await addToQueue(track);
            onClose();
        }
    };

    const handleAddToPlaylist = () => {
        if (track && onAddToPlaylist) {
            onAddToPlaylist(track);
            onClose();
        }
    };

    if (!track) return null;

    return (
        <BottomSheet isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
            <BottomSheet.Portal>
                <BottomSheet.Overlay />
                <BottomSheet.Content className="border-none rounded-t-3xl px-6 pb-8 pt-2">
                    <View className="flex-row items-center gap-4 mb-6">
                        <View className="w-20 h-20 rounded-xl bg-default overflow-hidden">
                            {track.image ? (
                                <Image
                                    source={{ uri: track.image }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            ) : (
                                <View className="w-full h-full items-center justify-center">
                                    <Ionicons name="musical-note" size={32} color={theme.foreground} />
                                </View>
                            )}
                        </View>
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-foreground leading-tight">
                                {track.title}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row gap-3 mb-3">
                        <Button
                            variant="primary"
                            onPress={handlePlay}
                            className="flex-[2] h-14 rounded-xl"
                        >
                            <View className="flex-row items-center gap-2">
                                <Ionicons name="play" size={24} color="white" />
                                <Text className="text-white font-bold text-lg">Play</Text>
                            </View>
                        </Button>
                        <Button
                            variant="ghost"
                            onPress={handleToggleFavorite}
                            className="flex-1 h-14 rounded-xl"
                        >
                            <Ionicons
                                name={isFavorite ? "heart" : "heart-outline"}
                                size={28}
                                color={isFavorite ? "#ef4444" : theme.foreground}
                            />
                        </Button>
                    </View>

                    <View className="flex-row gap-3 mb-3">
                        <Button
                            variant="secondary"
                            onPress={handleAddToQueue}
                            className="flex-1 h-12 rounded-xl"
                        >
                            <View className="flex-row items-center gap-2">
                                <Ionicons name="add-circle" size={20} color={theme.foreground} />
                                <Text className="text-foreground font-semibold">Add to Queue</Text>
                            </View>
                        </Button>
                        <Button
                            variant="secondary"
                            onPress={handlePlayNext}
                            className="flex-1 h-12 rounded-xl"
                        >
                            <View className="flex-row items-center gap-2">
                                <Ionicons name="play-skip-forward" size={20} color={theme.foreground} />
                                <Text className="text-foreground font-semibold">Play Next</Text>
                            </View>
                        </Button>
                    </View>

                    {onAddToPlaylist && (
                        <Button
                            variant="ghost"
                            onPress={handleAddToPlaylist}
                            className="w-full h-12 rounded-xl mb-2"
                        >
                            <View className="flex-row items-center gap-2">
                                <Ionicons name="list-circle" size={20} color={theme.foreground} />
                                <Text className="text-foreground font-semibold">Add to Playlist</Text>
                            </View>
                        </Button>
                    )}
                </BottomSheet.Content>
            </BottomSheet.Portal>
        </BottomSheet>
    );
};

export default TrackActionSheet;
