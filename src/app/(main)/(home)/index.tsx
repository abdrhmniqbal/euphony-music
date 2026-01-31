import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemRank } from "@/components/item";
import { EmptyState } from "@/components/empty-state";
import { playTrack, $tracks, Track } from "@/store/player-store";
import { useStore } from "@nanostores/react";
import { SectionTitle } from "@/components/section-title";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import React, { useState, useLayoutEffect, useCallback } from "react";
import { useNavigation, useRouter, useFocusEffect } from "expo-router";
import { Pressable, View, ScrollView, RefreshControl } from "react-native";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { Ionicons } from "@expo/vector-icons";
import { startIndexing, $indexerState } from "@/features/indexer";
import { getHistory, getTopSongs } from "@/db/operations";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { GestureDetector } from "react-native-gesture-handler";

const RECENTLY_PLAYED_LIMIT = 8;
const TOP_SONGS_LIMIT = 25;
const CHUNK_SIZE = 5;

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
};

export default function HomeScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];
    const indexerState = useStore($indexerState);
    const tracks = useStore($tracks);
    const { swipeGesture } = useSwipeNavigation('(home)');

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View className="flex-row gap-4 mr-1">
                    <Pressable
                        onPress={() => router.push("/search-interaction")}
                        className="active:opacity-50"
                    >
                        <Ionicons name="search-outline" size={24} color={theme.foreground} />
                    </Pressable>
                    <Pressable onPress={() => router.push("/settings")} className="active:opacity-50">
                        <Ionicons name="settings-outline" size={24} color={theme.foreground} />
                    </Pressable>
                </View>
            ),
        });
    }, [navigation, theme, router]);

    const [recentlyPlayedTracks, setRecentlyPlayedTracks] = useState<Track[]>([]);

    const fetchHistory = useCallback(async () => {
        const history = await getHistory();
        const seen = new Set<string>();
        const unique = history.filter((track: any) => {
            if (seen.has(track.id)) return false;
            seen.add(track.id);
            return true;
        });
        setRecentlyPlayedTracks(unique.slice(0, RECENTLY_PLAYED_LIMIT));
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [fetchHistory])
    );

    const onRefresh = useCallback(async () => {
        startIndexing(true);
        await fetchHistory();
    }, [fetchHistory]);

    const [topSongs, setTopSongs] = useState<Track[]>([]);

    const fetchTopSongs = useCallback(async () => {
        const songs = await getTopSongs('all', TOP_SONGS_LIMIT);
        setTopSongs(songs);
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchTopSongs();
        }, [fetchTopSongs])
    );

    // Combine refresh logic
    const handleRefresh = useCallback(async () => {
        await onRefresh();
        await fetchTopSongs();
    }, [onRefresh, fetchTopSongs]);

    const topSongsChunks = chunkArray(topSongs, CHUNK_SIZE);

    const renderRecentlyPlayedItem = useCallback((item: Track, index: number) => (
        <Item
            key={`${item.id}-${index}`}
            variant="grid"
            onPress={() => playTrack(item)}
        >
            <ItemImage icon="musical-note" image={item.image} />
            <ItemContent>
                <ItemTitle>{item.title}</ItemTitle>
                <ItemDescription>{item.artist || "Unknown Artist"}</ItemDescription>
            </ItemContent>
        </Item>
    ), []);

    const renderTopSongsChunk = useCallback((chunk: Track[], chunkIndex: number) => (
        <View key={`chunk-${chunkIndex}`} className="w-75">
            {chunk.map((music, index) => (
                <Item
                    key={`${music.id}-${chunkIndex}-${index}`}
                    onPress={() => playTrack(music)}
                >
                    <ItemImage icon="musical-note" image={music.image} />
                    <ItemRank>{chunkIndex * CHUNK_SIZE + index + 1}</ItemRank>
                    <ItemContent>
                        <ItemTitle>{music.title}</ItemTitle>
                        <ItemDescription>{music.artist || "Unknown Artist"}</ItemDescription>
                    </ItemContent>
                </Item>
            ))}
        </View>
    ), []);

    return (
        <GestureDetector gesture={swipeGesture}>
        <ScrollView
            className="flex-1 bg-background"
            contentContainerStyle={{ paddingBottom: 200 }}
            contentInsetAdjustmentBehavior="automatic"
            onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
            onScrollBeginDrag={handleScrollStart}
            onMomentumScrollEnd={handleScrollStop}
            onScrollEndDrag={handleScrollStop}
            scrollEventThrottle={16}
            refreshControl={
                <RefreshControl refreshing={indexerState.isIndexing} onRefresh={handleRefresh} tintColor={theme.accent} />
            }
        >
            <View className="pt-6">
                <SectionTitle
                    title="Recently Played"
                    className="px-4"
                    onViewMore={() => router.push("/(main)/(home)/recently-played")}
                />

                {recentlyPlayedTracks.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
                        className="mb-8"
                    >
                        {recentlyPlayedTracks.map((item, index) => renderRecentlyPlayedItem(item, index))}
                    </ScrollView>
                ) : (
                    <EmptyState
                        icon="time-outline"
                        title="No recently played"
                        message="Start playing music!"
                        className="mb-8 py-8"
                    />
                )}

                <SectionTitle
                    title="Top Songs"
                    className="px-4"
                    onViewMore={() => router.push("/(main)/(home)/top-songs")}
                />

                {topSongs.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 24 }}
                        className="mb-8"
                    >
                        {topSongsChunks.map(renderTopSongsChunk)}
                    </ScrollView>
                ) : (
                    <EmptyState
                        icon="musical-notes-outline"
                        title="No top songs"
                        message="Play more music together!"
                        className="mb-8 py-8"
                    />
                )}
            </View>
        </ScrollView>
        </GestureDetector>
    );
}