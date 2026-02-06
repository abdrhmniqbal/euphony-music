import React, { useState } from "react";
import { View, Text } from "react-native";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { Ionicons } from "@expo/vector-icons";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription } from "@/components/item";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { playTrack, Track } from "@/features/player/player.store";
import { EmptyState } from "@/components/empty-state";
import { TrackActionSheet } from "@/components/track-action-sheet";

interface SongListProps {
    data: Track[];
    onSongPress?: (track: Track) => void;
    showNumbers?: boolean;
    hideCover?: boolean;
    hideArtist?: boolean;
    getNumber?: (track: Track, index: number) => number | string;
    scrollEnabled?: boolean;
}

export const SongList: React.FC<SongListProps> = ({
    data,
    onSongPress,
    showNumbers = false,
    hideCover = false,
    hideArtist = false,
    getNumber,
    scrollEnabled = true
}) => {
    const theme = useThemeColors();
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handlePress = (track: Track) => {
        if (onSongPress) {
            onSongPress(track);
        } else {
            playTrack(track, data);
        }
    };

    const showActionMenu = (track: Track) => {
        setSelectedTrack(track);
        setIsSheetOpen(true);
    };

    const renderSongItem = (item: Track, index: number) => (
        <Item
            key={item.id}
            onPress={() => handlePress(item)}
        >
            {showNumbers ? (
                <View className="flex-row items-center gap-3">
                    {!hideCover && <ItemImage icon="musical-note" image={item.image} />}
                    <View className="w-8 items-center justify-center">
                        <Text className="text-lg font-bold text-foreground">
                            {getNumber ? getNumber(item, index) : index + 1}
                        </Text>
                    </View>
                </View>
            ) : (
                !hideCover && <ItemImage icon="musical-note" image={item.image} />
            )}
            <ItemContent>
                <ItemTitle>{item.title}</ItemTitle>
                {!hideArtist && <ItemDescription>{item.artist || "Unknown Artist"}</ItemDescription>}
            </ItemContent>
            <View className="p-2">
                <Ionicons 
                    name="ellipsis-horizontal" 
                    size={24} 
                    color={theme.muted}
                    onPress={() => showActionMenu(item)}
                />
            </View>
        </Item>
    );

    if (data.length === 0) {
        return <EmptyState icon="musical-note" title="No Songs" message="Songs you add to your library will appear here." />;
    }

    if (!scrollEnabled) {
        return (
            <>
                <View style={{ gap: 8 }}>
                    {data.map((item, index) => renderSongItem(item, index))}
                </View>
                <TrackActionSheet
                    track={selectedTrack}
                    isOpen={isSheetOpen}
                    onClose={() => setIsSheetOpen(false)}
                    tracks={data}
                />
            </>
        );
    }

    return (
        <>
            <LegendList
                data={data}
                renderItem={({ item, index }: LegendListRenderItemProps<Track>) => renderSongItem(item, index)}
                keyExtractor={(item) => item.id}
                style={{ flex: 1 }}
                contentContainerStyle={{ gap: 8 }}
                recycleItems={true}
                estimatedItemSize={72}
                drawDistance={250}
            />
            <TrackActionSheet
                track={selectedTrack}
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                tracks={data}
            />
        </>
    );
};
