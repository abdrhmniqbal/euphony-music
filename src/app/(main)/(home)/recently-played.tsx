import { View, Text, FlatList, RefreshControl } from "react-native";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemAction } from "@/components/item";
import { EmptyState } from "@/components/empty-state";
import { playTrack, Track } from "@/store/player-store";
import { Colors } from "@/constants/colors";
import { Button } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { useState, useCallback } from "react";
import { getHistory } from "@/utils/database";
import { useFocusEffect } from "expo-router";
import { useUniwind } from "uniwind";
import { useStore } from "@nanostores/react";
import { startIndexing, $indexerState } from "@/utils/media-indexer";

export default function RecentlyPlayedScreen() {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === "dark" ? "dark" : "light"];
    const [history, setHistory] = useState<Track[]>([]);
    const indexerState = useStore($indexerState);

    const fetchHistory = useCallback(() => {
        const data = getHistory();
        const seen = new Set<string>();
        const unique = data.filter(track => {
            if (seen.has(track.id)) return false;
            seen.add(track.id);
            return true;
        });
        setHistory(unique);
    }, []);

    const onRefresh = useCallback(() => {
        startIndexing(true);
        fetchHistory();
    }, [fetchHistory]);

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [fetchHistory])
    );

    const handlePlayFirst = useCallback(() => {
        if (history.length > 0) {
            playTrack(history[0]);
        }
    }, [history]);

    const handleShuffle = useCallback(() => {
        if (history.length > 0) {
            const randomIndex = Math.floor(Math.random() * history.length);
            playTrack(history[randomIndex]);
        }
    }, [history]);

    const renderItem = useCallback(({ item }: { item: Track }) => (
        <Item onPress={() => playTrack(item)}>
            <ItemImage icon="musical-note" image={item.image} />
            <ItemContent>
                <ItemTitle>{item.title}</ItemTitle>
                <ItemDescription>{item.artist || "Unknown Artist"}</ItemDescription>
            </ItemContent>
            <ItemAction>
                <Ionicons name="ellipsis-horizontal" size={24} color={theme.muted} />
            </ItemAction>
        </Item>
    ), [theme.muted]);

    const keyExtractor = useCallback((item: Track, index: number) => `${item.id}-${index}`, []);

    return (
        <View className="flex-1 bg-background">
            {history.length > 0 && (
                <View className="flex-row px-4 py-4 gap-4">
                    <Button
                        className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                        onPress={handlePlayFirst}
                    >
                        <Ionicons name="play" size={20} color={theme.foreground} />
                        <Text className="text-lg font-bold text-foreground uppercase">Play</Text>
                    </Button>
                    <Button
                        className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                        onPress={handleShuffle}
                    >
                        <Ionicons name="shuffle" size={20} color={theme.foreground} />
                        <Text className="text-lg font-bold text-foreground uppercase">Shuffle</Text>
                    </Button>
                </View>
            )}

            <FlatList
                data={history}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 200 }}
                className="flex-1"
                onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
                onScrollBeginDrag={handleScrollStart}
                onMomentumScrollEnd={handleScrollStop}
                onScrollEndDrag={handleScrollStop}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl refreshing={indexerState.isIndexing} onRefresh={onRefresh} tintColor={theme.accent} />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon="time-outline"
                        title="No recently played"
                        message="Your listening history will appear here once you start playing music."
                        className="mt-12"
                    />
                }
            />
        </View>
    );
}
