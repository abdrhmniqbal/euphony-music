import React, { useCallback } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemAction } from "@/components/item";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import { EmptyState } from "@/components/empty-state";

export interface Playlist {
    id: string;
    title: string;
    songCount: number;
    image?: string;
}

interface PlaylistListProps {
    data: Playlist[];
    onPlaylistPress?: (playlist: Playlist) => void;
    onCreatePlaylist?: () => void;
}

const GRID_ITEMS = [1, 2, 3, 4] as const;

export const PlaylistList: React.FC<PlaylistListProps> = ({
    data,
    onPlaylistPress,
    onCreatePlaylist
}) => {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];

    const handlePress = useCallback((playlist: Playlist) => {
        onPlaylistPress?.(playlist);
    }, [onPlaylistPress]);

    const handleCreate = useCallback(() => {
        onCreatePlaylist?.();
    }, [onCreatePlaylist]);

    const formatSongCount = (count: number) =>
        `${count} ${count === 1 ? 'song' : 'songs'}`;

    return (
        <View className="gap-2">
            <Item onPress={handleCreate}>
                <ItemImage className="bg-default items-center justify-center">
                    <Ionicons name="add" size={32} color={theme.foreground} />
                </ItemImage>
                <ItemContent>
                    <ItemTitle>New Playlist</ItemTitle>
                </ItemContent>
            </Item>
            {data.length === 0 ? (
                <EmptyState icon="list" title="No Playlists" message="Create your first playlist to organize your music." />
            ) : (
                data.map((playlist) => (
                    <Item
                        key={playlist.id}
                        onPress={() => handlePress(playlist)}
                    >
                        <ItemImage className="bg-default items-center justify-center overflow-hidden p-1">
                            {playlist.image ? (
                                <View className="w-full h-full rounded-lg overflow-hidden">
                                    <View className="w-full h-full bg-default" />
                                </View>
                            ) : (
                                <View className="flex-row flex-wrap w-full h-full">
                                    {GRID_ITEMS.map((i) => (
                                        <View key={i} className="w-1/2 h-1/2 p-px">
                                            <View className="w-full h-full bg-muted/20 rounded-sm items-center justify-center">
                                                <Ionicons name="musical-note" size={10} color={theme.muted} style={{ opacity: 0.5 }} />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </ItemImage>
                        <ItemContent>
                            <ItemTitle>{playlist.title}</ItemTitle>
                            <ItemDescription>{formatSongCount(playlist.songCount)}</ItemDescription>
                        </ItemContent>
                        <ItemAction>
                            <Ionicons name="chevron-forward" size={24} color={theme.muted} />
                        </ItemAction>
                    </Item>
                ))
            )}
        </View>
    );
};
