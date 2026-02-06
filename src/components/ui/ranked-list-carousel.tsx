import React from "react";
import { View } from "react-native";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemRank } from "@/components/item";
import { MediaCarousel } from "./media-carousel";
import { Track, playTrack } from "@/features/player/player.store";
import { chunkArray } from "@/utils/array";

interface EmptyStateConfig {
    icon: string;
    title: string;
    message: string;
}

interface RankedListCarouselProps {
    data: Track[];
    chunkSize?: number;
    emptyState?: EmptyStateConfig;
    onItemPress?: (track: Track) => void;
    className?: string;
}

export function RankedListCarousel({
    data,
    chunkSize = 5,
    emptyState,
    onItemPress,
    className = "mb-8",
}: RankedListCarouselProps) {
    const chunks = chunkArray(data, chunkSize);

    const handlePress = (track: Track) => {
        if (onItemPress) {
            onItemPress(track);
        } else {
            playTrack(track, data);
        }
    };

    const renderChunk = (chunk: Track[], chunkIndex: number) => (
        <View className="w-75">
            {chunk.map((track, index) => (
                <Item
                    key={`${track.id}-${chunkIndex}-${index}`}
                    onPress={() => handlePress(track)}
                >
                    <ItemImage icon="musical-note" image={track.image} />
                    <ItemRank>{chunkIndex * chunkSize + index + 1}</ItemRank>
                    <ItemContent>
                        <ItemTitle>{track.title}</ItemTitle>
                        <ItemDescription>{track.artist || "Unknown Artist"}</ItemDescription>
                    </ItemContent>
                </Item>
            ))}
        </View>
    );

    return (
        <MediaCarousel
            data={chunks}
            renderItem={renderChunk}
            keyExtractor={(_, index) => `chunk-${index}`}
            emptyState={emptyState}
            gap={24}
            className={className}
        />
    );
}
