import React, { useCallback } from "react";
import { View, ScrollView } from "react-native";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription } from "@/components/item";
import { EmptyState } from "@/components/empty-state";

export interface Album {
    id: string;
    title: string;
    artist: string;
    albumArtist?: string;
    image?: string;
    trackCount?: number;
}

interface AlbumGridProps {
    data: Album[];
    onAlbumPress?: (album: Album) => void;
    horizontal?: boolean;
    containerClassName?: string;
}

export const AlbumGrid: React.FC<AlbumGridProps> = ({ data, onAlbumPress, horizontal, containerClassName = "" }) => {
    const handlePress = useCallback((album: Album) => {
        onAlbumPress?.(album);
    }, [onAlbumPress]);

    if (data.length === 0) {
        return <EmptyState icon="disc" title="No Albums" message="Albums you add to your library will appear here." />;
    }

    const content = data.map((album) => (
        <Item
            key={album.id}
            variant="grid"
            className={horizontal ? "w-36" : "w-[47%]"}
            onPress={() => handlePress(album)}
        >
            <ItemImage icon="disc" image={album.image} className="w-full aspect-square rounded-md" />
            <ItemContent className="mt-1">
                <ItemTitle className="text-sm normal-case" numberOfLines={1}>{album.title}</ItemTitle>
                <ItemDescription numberOfLines={1}>
                    {album.albumArtist || album.artist}{album.trackCount ? ` • ${album.trackCount} tracks` : ""}
                </ItemDescription>
            </ItemContent>
        </Item>
    ));

    const spacerCount = data.length % 2 === 0 ? 0 : 2 - (data.length % 2);
    const spacers = Array.from({ length: spacerCount }).map((_, i) => (
        <View key={`spacer-${i}`} className="w-[47%]" />
    ));

    if (horizontal) {
        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 16 }}
                className={containerClassName}
            >
                {content}
            </ScrollView>
        );
    }

    return (
        <View className={`flex-row flex-wrap gap-4 ${containerClassName}`}>
            {content}
            {spacers}
        </View>
    );
};
