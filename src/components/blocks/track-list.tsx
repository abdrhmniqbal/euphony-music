import React, { useState } from "react";
import { View } from "react-native";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { playTrack, Track } from "@/modules/player/player.store";
import { EmptyState } from "@/components/ui";
import { TrackActionSheet } from "@/components/blocks/track-action-sheet";
import { TrackRow } from "@/components/patterns";

interface TrackListProps {
    data: Track[];
    onTrackPress?: (track: Track) => void;
    showNumbers?: boolean;
    hideCover?: boolean;
    hideArtist?: boolean;
    getNumber?: (track: Track, index: number) => number | string;
    scrollEnabled?: boolean;
}

export const TrackList: React.FC<TrackListProps> = ({
    data,
    onTrackPress,
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
        if (onTrackPress) {
            onTrackPress(track);
        } else {
            playTrack(track, data);
        }
    };

    const showActionMenu = (track: Track) => {
        setSelectedTrack(track);
        setIsSheetOpen(true);
    };

    const renderTrackItem = (item: Track, index: number) => (
        <TrackRow
            key={`${item.id}-${index}`}
            track={item}
            onPress={() => handlePress(item)}
            rank={showNumbers ? (getNumber ? getNumber(item, index) : index + 1) : undefined}
            showCover={!hideCover}
            showArtist={!hideArtist}
            rightAction={
                <Ionicons
                    name="ellipsis-horizontal"
                    size={24}
                    color={theme.muted}
                    onPress={() => showActionMenu(item)}
                />
            }
        />
    );

    if (data.length === 0) {
        return <EmptyState icon="musical-note" title="No Tracks" message="Tracks you add to your library will appear here." />;
    }

    if (!scrollEnabled) {
        return (
            <>
                <View style={{ gap: 8 }}>
                    {data.map((item, index) => renderTrackItem(item, index))}
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
                renderItem={({ item, index }: LegendListRenderItemProps<Track>) => renderTrackItem(item, index)}
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
