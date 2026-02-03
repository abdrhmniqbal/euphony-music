import React, { useCallback } from "react";
import { View, Dimensions } from "react-native";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription } from "@/components/item";
import { EmptyState } from "@/components/empty-state";

export interface Artist {
    id: string;
    name: string;
    trackCount: number;
    image?: string;
    dateAdded: number;
}

interface ArtistGridProps {
    data: Artist[];
    onArtistPress?: (artist: Artist) => void;
    scrollEnabled?: boolean;
}

const GAP = 12;
const NUM_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 28;
const ITEM_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING - (GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

export const ArtistGrid: React.FC<ArtistGridProps> = ({ data, onArtistPress, scrollEnabled = true }) => {
    const handlePress = useCallback((artist: Artist) => {
        onArtistPress?.(artist);
    }, [onArtistPress]);

    const formatTrackCount = (count: number) =>
        `${count} ${count === 1 ? 'track' : 'tracks'}`;

    const renderArtistItem = useCallback((item: Artist) => (
        <Item
            key={item.id}
            variant="grid"
            style={{ width: ITEM_WIDTH }}
            onPress={() => handlePress(item)}
        >
            <ItemImage icon="person" image={item.image} className="w-full aspect-square rounded-full bg-default" />
            <ItemContent className="mt-1 items-center">
                <ItemTitle className="text-sm text-center normal-case" numberOfLines={1}>{item.name}</ItemTitle>
                <ItemDescription className="text-center">{formatTrackCount(item.trackCount)}</ItemDescription>
            </ItemContent>
        </Item>
    ), [handlePress]);

    if (data.length === 0) {
        return <EmptyState icon="people" title="No Artists" message="Artists from your music library will appear here." />;
    }

    if (!scrollEnabled) {
        const rows = [];
        for (let i = 0; i < data.length; i += NUM_COLUMNS) {
            rows.push(data.slice(i, i + NUM_COLUMNS));
        }
        return (
            <View style={{ gap: GAP }}>
                {rows.map((row, rowIndex) => (
                    <View key={rowIndex} style={{ flexDirection: 'row', gap: GAP }}>
                        {row.map((item) => renderArtistItem(item))}
                    </View>
                ))}
            </View>
        );
    }

    return (
        <LegendList
            data={data}
            renderItem={({ item }: LegendListRenderItemProps<Artist>) => renderArtistItem(item)}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={{ gap: GAP }}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            style={{ flex: 1 }}
            recycleItems={true}
            estimatedItemSize={150}
            drawDistance={200}
        />
    );
};
