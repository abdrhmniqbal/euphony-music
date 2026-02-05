import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription } from "@/components/item";
import { playTrack, $tracks, Track } from "@/store/player-store";
import { useStore } from "@nanostores/react";
import { useThemeColors } from "@/hooks/use-theme-colors";
import React, { useState, useLayoutEffect, useCallback } from "react";
import { useNavigation, useRouter, useFocusEffect } from "expo-router";
import { Pressable, View, ScrollView, RefreshControl } from "react-native";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { Ionicons } from "@expo/vector-icons";
import { startIndexing, $indexerState } from "@/features/indexer";
import { getHistory, getTopSongs } from "@/db/operations";

import { ContentSection, MediaCarousel, RankedListCarousel } from "@/components/ui";

const RECENTLY_PLAYED_LIMIT = 8;
const TOP_SONGS_LIMIT = 25;
const CHUNK_SIZE = 5;

export default function HomeScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const theme = useThemeColors();
    const indexerState = useStore($indexerState);
    const tracks = useStore($tracks);


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

    const handleRefresh = useCallback(async () => {
        await onRefresh();
        await fetchTopSongs();
    }, [onRefresh, fetchTopSongs]);

    const renderRecentlyPlayedItem = useCallback((item: Track, index: number) => (
        <Item
            variant="grid"
            onPress={() => playTrack(item, recentlyPlayedTracks)}
        >
            <ItemImage icon="musical-note" image={item.image} />
            <ItemContent>
                <ItemTitle>{item.title}</ItemTitle>
                <ItemDescription>{item.artist || "Unknown Artist"}</ItemDescription>
            </ItemContent>
        </Item>
    ), [recentlyPlayedTracks]);

    return (
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
                <ContentSection
                    title="Recently Played"
                    data={recentlyPlayedTracks}
                    onViewMore={() => router.push("/(main)/(home)/recently-played")}
                    emptyState={{
                        icon: "time-outline",
                        title: "No recently played",
                        message: "Start playing music!",
                    }}
                    renderContent={(data) => (
                        <MediaCarousel
                            data={data}
                            renderItem={renderRecentlyPlayedItem}
                            keyExtractor={(item, index) => `${item.id}-${index}`}
                            gap={10}
                        />
                    )}
                />

                <ContentSection
                    title="Top Songs"
                    data={topSongs}
                    onViewMore={() => router.push("/(main)/(home)/top-songs")}
                    emptyState={{
                        icon: "musical-notes-outline",
                        title: "No top songs",
                        message: "Play more music together!",
                    }}
                    renderContent={(data) => (
                        <RankedListCarousel
                            data={data}
                            chunkSize={CHUNK_SIZE}
                        />
                    )}
                />
            </View>
        </ScrollView>
    );
}