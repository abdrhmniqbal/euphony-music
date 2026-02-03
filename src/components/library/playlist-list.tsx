import React, { useCallback } from "react";
import { View, Text, Image } from "react-native";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { Ionicons } from "@expo/vector-icons";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemAction } from "@/components/item";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { EmptyState } from "@/components/empty-state";

export interface Playlist {
    id: string;
    title: string;
    songCount: number;
    image?: string;
    images?: string[];
}

interface PlaylistListProps {
    data: Playlist[];
    onPlaylistPress?: (playlist: Playlist) => void;
    onCreatePlaylist?: () => void;
    scrollEnabled?: boolean;
}

const GRID_ITEMS = [1, 2, 3, 4] as const;

export const PlaylistList: React.FC<PlaylistListProps> = ({
    data,
    onPlaylistPress,
    onCreatePlaylist,
    scrollEnabled = true
}) => {
    const theme = useThemeColors();

    const handlePress = useCallback((playlist: Playlist) => {
        onPlaylistPress?.(playlist);
    }, [onPlaylistPress]);

    const handleCreate = useCallback(() => {
        onCreatePlaylist?.();
    }, [onCreatePlaylist]);

    const formatSongCount = (count: number) =>
        `${count} ${count === 1 ? 'song' : 'songs'}`;

    const renderCreateButton = () => (
        <Item key="create" onPress={handleCreate}>
            <ItemImage className="bg-default items-center justify-center">
                <Ionicons name="add" size={32} color={theme.foreground} />
            </ItemImage>
            <ItemContent>
                <ItemTitle>New Playlist</ItemTitle>
            </ItemContent>
        </Item>
    );

    const renderPlaylistItem = useCallback((item: Playlist) => (
        <Item
            key={item.id}
            onPress={() => handlePress(item)}
        >
            <ItemImage className="bg-default items-center justify-center overflow-hidden">
                {item.image ? (
                    <Image
                        source={{ uri: item.image }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : item.images && item.images.length >= 4 ? (
                    <View className="flex-row flex-wrap w-full h-full overflow-hidden">
                        {item.images.slice(0, 4).map((img, i) => (
                            <Image
                                key={i}
                                source={{ uri: img }}
                                className="w-1/2 h-1/2"
                                resizeMode="cover"
                            />
                        ))}
                    </View>
                ) : item.images && item.images.length > 0 ? (
                    <Image
                        source={{ uri: item.images[0] }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="w-full h-full items-center justify-center bg-muted/20">
                        <Ionicons name="musical-notes" size={24} color={theme.muted} />
                    </View>
                )}
            </ItemImage>
            <ItemContent>
                <ItemTitle>{item.title}</ItemTitle>
                <ItemDescription>{formatSongCount(item.songCount)}</ItemDescription>
            </ItemContent>
            <ItemAction>
                <Ionicons name="chevron-forward" size={24} color={theme.muted} />
            </ItemAction>
        </Item>
    ), [handlePress, theme.muted]);

    if (!scrollEnabled) {
        return (
            <View style={{ gap: 8 }}>
                {renderCreateButton()}
                {data.map(renderPlaylistItem)}
            </View>
        );
    }

    if (data.length === 0) {
        return (
            <LegendList
                data={[{ id: 'create', isCreateButton: true }]}
                renderItem={() => renderCreateButton()}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ gap: 8 }}
                recycleItems={true}
                ListEmptyComponent={
                    <EmptyState icon="list" title="No Playlists" message="Create your first playlist to organize your music." />
                }
                estimatedItemSize={72}
                drawDistance={250}
                style={{ flex: 1 }}
            />
        );
    }

    const listData = [
        { id: 'create', isCreateButton: true },
        ...data
    ];

    return (
        <LegendList
            data={listData}
            renderItem={({ item }: LegendListRenderItemProps<any>) => {
                if (item.isCreateButton) {
                    return renderCreateButton();
                }
                return renderPlaylistItem(item);
            }}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 8 }}
            recycleItems={true}
            estimatedItemSize={72}
            drawDistance={250}
            style={{ flex: 1 }}
        />
    );
};
