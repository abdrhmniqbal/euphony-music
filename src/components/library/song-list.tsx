import React, { useCallback } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemAction } from "@/components/item";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import { playTrack, Track } from "@/store/player-store";
import { EmptyState } from "@/components/empty-state";

interface SongListProps {
    data: Track[];
    onSongPress?: (track: Track) => void;
    showNumbers?: boolean;
    hideCover?: boolean;
    hideArtist?: boolean;
    getNumber?: (track: Track, index: number) => number | string;
}

export const SongList: React.FC<SongListProps> = ({ data, onSongPress, showNumbers = false, hideCover = false, hideArtist = false, getNumber }) => {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];

    const handlePress = useCallback((track: Track) => {
        if (onSongPress) {
            onSongPress(track);
        } else {
            playTrack(track);
        }
    }, [onSongPress]);

    if (data.length === 0) {
        return <EmptyState icon="musical-note" title="No Songs" message="Songs you add to your library will appear here." />;
    }

    return (
        <View className="gap-2">
            {data.map((music, index) => (
                <Item
                    key={music.id}
                    onPress={() => handlePress(music)}
                >
                    {showNumbers ? (
                        <View className="flex-row items-center gap-3">
                            {!hideCover && <ItemImage icon="musical-note" image={music.image} />}
                            <View className="w-8 items-center justify-center">
                                <Text className="text-lg font-bold text-foreground">
                                    {getNumber ? getNumber(music, index) : index + 1}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        !hideCover && <ItemImage icon="musical-note" image={music.image} />
                    )}
                    <ItemContent>
                        <ItemTitle>{music.title}</ItemTitle>
                        {!hideArtist && <ItemDescription>{music.artist || "Unknown Artist"}</ItemDescription>}
                    </ItemContent>
                    <ItemAction>
                        <Ionicons name="ellipsis-horizontal" size={24} color={theme.muted} />
                    </ItemAction>
                </Item>
            ))}
        </View>
    );
};
