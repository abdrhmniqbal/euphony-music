import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { EmptyState } from "@/components/empty-state";
import { playTrack, $tracks, Track } from "@/store/player-store";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Button } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { useStore } from "@nanostores/react";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { startIndexing, $indexerState } from "@/features/indexer";
import { getTopSongs } from "@/db/operations";
import { useFocusEffect } from "expo-router";
import { SongList } from "@/components/library/song-list";

const TABS = ["Realtime", "Daily", "Weekly"] as const;
type TabType = typeof TABS[number];

const TOP_SONGS_LIMIT = 10;

export default function TopSongsScreen() {
    const [activeTab, setActiveTab] = useState<TabType>("Realtime");
    const indexerState = useStore($indexerState);
    const theme = useThemeColors();
    const tracks = useStore($tracks);

    const onRefresh = useCallback(() => {
        startIndexing(true);
    }, []);

    const [currentSongs, setCurrentSongs] = useState<Track[]>([]);

    const fetchSongs = useCallback(async () => {
        const period = activeTab === "Daily" ? 'day' : activeTab === "Weekly" ? 'week' : 'all';
        const songs = await getTopSongs(period, TOP_SONGS_LIMIT);
        setCurrentSongs(songs);
    }, [activeTab]);

    useFocusEffect(
        useCallback(() => {
            fetchSongs();
        }, [fetchSongs])
    );

    const handleRefresh = useCallback(async () => {
        onRefresh();
        await fetchSongs();
    }, [onRefresh, fetchSongs]);

    const handlePlayAll = useCallback(() => {
        if (currentSongs.length > 0) {
            playTrack(currentSongs[0], currentSongs);
        }
    }, [currentSongs]);

    const handleShuffle = useCallback(() => {
        if (currentSongs.length > 0) {
            const randomIndex = Math.floor(Math.random() * currentSongs.length);
            playTrack(currentSongs[randomIndex], currentSongs);
        }
    }, [currentSongs]);

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row px-4 py-4 gap-6">
                {TABS.map((tab) => (
                    <Pressable key={tab} onPress={() => setActiveTab(tab)}>
                        <Text
                            className={`text-xl font-bold ${activeTab === tab ? 'text-foreground' : 'text-muted'}`}
                        >
                            {tab}
                        </Text>
                    </Pressable>
                ))}
            </View>

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
                    <RefreshControl refreshing={indexerState.isIndexing} onRefresh={handleRefresh} tintColor={theme.accent} />
                }
            >
                {currentSongs.length > 0 && (
                    <View className="flex-row px-4 py-4 gap-4">
                        <Button
                            className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                            onPress={handlePlayAll}
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

                <Animated.View
                    key={activeTab}
                    entering={FadeInRight.duration(300)}
                    exiting={FadeOutLeft.duration(300)}
                    className="px-4"
                >
                    {currentSongs.length === 0 ? (
                        <EmptyState
                            icon="musical-notes-outline"
                            title="No top songs yet"
                            message="Play some music to see your most played tracks here!"
                            className="mt-12"
                        />
                    ) : (
                        <SongList data={currentSongs} showNumbers />
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}