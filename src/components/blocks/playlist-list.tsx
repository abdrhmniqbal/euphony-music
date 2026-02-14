import React from "react";
import { View } from "react-native";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState, Item, ItemAction, ItemContent, ItemDescription, ItemImage, ItemTitle } from "@/components/ui";
import { PlaylistArtwork } from "@/components/patterns";
import { useThemeColors } from "@/hooks/use-theme-colors";

export interface Playlist {
    id: string;
    title: string;
    trackCount: number;
    image?: string;
    images?: string[];
}

interface PlaylistListProps {
    data: Playlist[];
    onPlaylistPress?: (playlist: Playlist) => void;
    onCreatePlaylist?: () => void;
    scrollEnabled?: boolean;
}

export const PlaylistList: React.FC<PlaylistListProps> = ({
    data,
    onPlaylistPress,
    onCreatePlaylist,
    scrollEnabled = true
}) => {
    const theme = useThemeColors();

    const handlePress = (playlist: Playlist) => {
        onPlaylistPress?.(playlist);
    };

    const handleCreate = () => {
        onCreatePlaylist?.();
    };

    const formatTrackCount = (count: number) =>
        `${count} ${count === 1 ? 'track' : 'tracks'}`;

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

    const renderPlaylistItem = (item: Playlist) => (
        <Item
            key={item.id}
            onPress={() => handlePress(item)}
        >
            <ItemImage className="bg-default items-center justify-center overflow-hidden">
                <PlaylistArtwork
                    images={item.images && item.images.length > 0 ? item.images : item.image ? [item.image] : undefined}
                />
            </ItemImage>
            <ItemContent>
                <ItemTitle>{item.title}</ItemTitle>
                <ItemDescription>{formatTrackCount(item.trackCount)}</ItemDescription>
            </ItemContent>
            <ItemAction>
                <Ionicons name="chevron-forward" size={24} color={theme.muted} />
            </ItemAction>
        </Item>
    );

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
