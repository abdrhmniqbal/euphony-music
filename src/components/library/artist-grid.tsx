import React, { useCallback } from "react";
import { View } from "react-native";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription } from "@/components/item";
import { EmptyState } from "@/components/empty-state";

export interface Artist {
    id: string;
    name: string;
    trackCount: number;
    image?: string;
}

interface ArtistGridProps {
    data: Artist[];
    onArtistPress?: (artist: Artist) => void;
}

export const ArtistGrid: React.FC<ArtistGridProps> = ({ data, onArtistPress }) => {
    const handlePress = useCallback((artist: Artist) => {
        onArtistPress?.(artist);
    }, [onArtistPress]);

    const formatTrackCount = (count: number) =>
        `${count} ${count === 1 ? 'track' : 'tracks'}`;

    if (data.length === 0) {
        return <EmptyState icon="people" title="No Artists" message="Artists from your music library will appear here." />;
    }

    return (
        <View className="flex-row flex-wrap gap-4">
            {data.map((artist) => (
                <Item
                    key={artist.id}
                    variant="grid"
                    className="w-[30%] grow"
                    onPress={() => handlePress(artist)}
                >
                    <ItemImage icon="person" image={artist.image} className="w-full aspect-square rounded-full bg-default" />
                    <ItemContent className="mt-1 items-center">
                        <ItemTitle className="text-sm text-center normal-case" numberOfLines={1}>{artist.name}</ItemTitle>
                        <ItemDescription className="text-center">{formatTrackCount(artist.trackCount)}</ItemDescription>
                    </ItemContent>
                </Item>
            ))}
        </View>
    );
};
