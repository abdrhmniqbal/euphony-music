import { View, Text, ScrollView, RefreshControl } from "react-native";
import { EmptyState } from "@/components/empty-state";
import { playTrack, Track } from "@/store/player-store";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Button } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { useState, useCallback } from "react";
import { getHistory } from "@/db/operations";
import { useFocusEffect } from "expo-router";
import { useStore } from "@nanostores/react";
import { startIndexing, $indexerState } from "@/features/indexer";
import { SongList } from "@/components/library/song-list";

export default function RecentlyPlayedScreen() {
    const theme = useThemeColors();
    const [history, setHistory] = useState<Track[]>([]);
    const indexerState = useStore($indexerState);

    const fetchHistory = useCallback(async () => {
        const data = await getHistory();
        const seen = new Set<string>();
        const unique = data.filter((track: any) => {
            if (seen.has(track.id)) return false;
            seen.add(track.id);
            return true;
        });
        setHistory(unique);
    }, []);

    const onRefresh = useCallback(async () => {
        startIndexing(true);
        await fetchHistory();
    }, [fetchHistory]);

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [fetchHistory])
    );

    const handlePlayFirst = useCallback(() => {
        if (history.length > 0) {
            playTrack(history[0], history);
        }
    }, [history]);

    const handleShuffle = useCallback(() => {
        if (history.length > 0) {
            const randomIndex = Math.floor(Math.random() * history.length);
            playTrack(history[randomIndex], history);
        }
    }, [history]);

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 200 }}
                onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
                onScrollBeginDrag={handleScrollStart}
                onMomentumScrollEnd={handleScrollStop}
                onScrollEndDrag={handleScrollStop}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl refreshing={indexerState.isIndexing} onRefresh={onRefresh} tintColor={theme.accent} />
                }
            >
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

                <View className="px-4">
                    {history.length === 0 ? (
                        <EmptyState
                            icon="time-outline"
                            title="No recently played"
                            message="Your listening history will appear here once you start playing music."
                            className="mt-12"
                        />
                    ) : (
                        <SongList data={history} />
                    )}
                </View>
            </ScrollView>
        </View>
    );
}