import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemRank, ItemAction } from "@/components/item";
import { EmptyState } from "@/components/empty-state";
import { playTrack, $tracks, Track } from "@/store/player-store";
import { Colors } from "@/constants/colors";
import { Button } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { useUniwind } from "uniwind";
import { useStore } from "@nanostores/react";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { startIndexing, $indexerState } from "@/utils/media-indexer";
import { getTopSongs } from "@/utils/database";
import { useFocusEffect } from "expo-router";

const TABS = ["Realtime", "Daily", "Weekly"] as const;
type TabType = typeof TABS[number];

const TOP_SONGS_LIMIT = 10;

export default function TopSongsScreen() {
    const [activeTab, setActiveTab] = useState<TabType>("Realtime");
    const indexerState = useStore($indexerState);
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === "dark" ? "dark" : "light"];
    const tracks = useStore($tracks);

    const onRefresh = useCallback(() => {
        startIndexing(true);
    }, []);

    const [currentSongs, setCurrentSongs] = useState<Track[]>([]);

    const fetchSongs = useCallback(() => {
        const period = activeTab === "Daily" ? 'day' : activeTab === "Weekly" ? 'week' : 'all';
        const songs = getTopSongs(period, TOP_SONGS_LIMIT);
        setCurrentSongs(songs);
    }, [activeTab]);

    useFocusEffect(
        useCallback(() => {
            fetchSongs();
        }, [fetchSongs])
    );

    const handleRefresh = useCallback(() => {
        onRefresh();
        fetchSongs();
    }, [onRefresh, fetchSongs]);

    const handlePlayAll = useCallback(() => {
        if (currentSongs.length > 0) {
            playTrack(currentSongs[0]);
        }
    }, [currentSongs]);

    const handleShuffle = useCallback(() => {
        if (currentSongs.length > 0) {
            const randomIndex = Math.floor(Math.random() * currentSongs.length);
            playTrack(currentSongs[randomIndex]);
        }
    }, [currentSongs]);

    const renderItem = useCallback(({ item, index }: { item: Track; index: number }) => (
        <Item onPress={() => playTrack(item)}>
            <ItemImage icon="musical-note" image={item.image} />
            <ItemRank>{index + 1}</ItemRank>
            <ItemContent>
                <ItemTitle>{item.title}</ItemTitle>
                <ItemDescription>{item.artist || "Unknown Artist"}</ItemDescription>
            </ItemContent>
            <ItemAction>
                <Ionicons name="ellipsis-horizontal" size={24} color={theme.muted} />
            </ItemAction>
        </Item>
    ), [theme.muted]);

    const keyExtractor = useCallback((item: Track, index: number) => `${activeTab}-${item.id}-${index}`, [activeTab]);

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row px-4 py-4 gap-6">
                {TABS.map((tab) => (
                    <Pressable key={tab} onPress={() => setActiveTab(tab)}>
                        <Text
                            className={`text-2xl font-bold ${activeTab === tab ? 'text-foreground' : 'text-muted'}`}
                        >
                            {tab}
                        </Text>
                    </Pressable>
                ))}
            </View>

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
                className="flex-1"
            >
                <FlatList
                    data={currentSongs}
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
                        <RefreshControl refreshing={indexerState.isIndexing} onRefresh={handleRefresh} tintColor={theme.accent} />
                    }
                    ListEmptyComponent={
                        <EmptyState
                            icon="musical-notes-outline"
                            title="No top songs yet"
                            message="Play some music to see your most played tracks here!"
                            className="mt-12"
                        />
                    }
                />
            </Animated.View>
        </View>
    );
}
