import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useState, useCallback, useEffect } from "react";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/empty-state";
import { playTrack, $tracks, Track } from "@/store/player-store";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Button } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { useStore } from "@nanostores/react";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { startIndexing, $indexerState } from "@/features/indexer";
import { SongList } from "@/components/library/song-list";
import { db } from "@/db/client";
import { genres, trackGenres } from "@/db/schema";
import { eq } from "drizzle-orm";

export default function GenreTopSongsScreen() {
    const { name } = useLocalSearchParams<{ name: string }>();
    const navigation = useNavigation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const indexerState = useStore($indexerState);
    const theme = useThemeColors();
    const allTracks = useStore($tracks);

    const genreName = decodeURIComponent(name || "");

    const [genreTrackIds, setGenreTrackIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const loadGenreTrackIds = useCallback(async () => {
        setIsLoading(true);
        try {
            const genreRecord = await db.query.genres.findFirst({
                where: eq(genres.name, genreName),
            });

            if (genreRecord) {
                const trackGenreLinks = await db.query.trackGenres.findMany({
                    where: eq(trackGenres.genreId, genreRecord.id),
                });
                setGenreTrackIds(new Set(trackGenreLinks.map(tg => tg.trackId)));
            } else {
                setGenreTrackIds(new Set());
            }
        } catch (e) {
            setGenreTrackIds(new Set());
        } finally {
            setIsLoading(false);
        }
    }, [genreName]);

    useEffect(() => {
        loadGenreTrackIds();
    }, [loadGenreTrackIds]);

    const topSongs = (() => {
        if (genreTrackIds.size === 0) return [];

        return allTracks
            .filter(t => genreTrackIds.has(t.id) && !t.isDeleted)
            .sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    })();

    const handleRefresh = useCallback(async () => {
        startIndexing(true);
        await loadGenreTrackIds();
    }, [loadGenreTrackIds]);

    const handlePlayAll = useCallback(() => {
        if (topSongs.length > 0) {
            playTrack(topSongs[0], topSongs);
        }
    }, [topSongs]);

    const handleShuffle = useCallback(() => {
        if (topSongs.length > 0) {
            const randomIndex = Math.floor(Math.random() * topSongs.length);
            playTrack(topSongs[randomIndex], topSongs);
        }
    }, [topSongs]);

    return (
        <View className="flex-1 bg-background">
            <View
                className="absolute top-0 left-0 right-0 z-50 flex-row items-center justify-between px-4 bg-background"
                style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
            >
                <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full items-center justify-center active:opacity-50"
                >
                    <Ionicons name="chevron-back" size={24} color={theme.foreground} />
                </Pressable>

                <Text
                    className="text-lg font-bold text-foreground flex-1 text-center mx-2"
                    numberOfLines={1}
                >
                    {genreName} Top Songs
                </Text>

                <Pressable
                    onPress={() => router.push("/settings")}
                    className="w-10 h-10 rounded-full items-center justify-center active:opacity-50"
                >
                    <Ionicons name="ellipsis-horizontal" size={22} color={theme.foreground} />
                </Pressable>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: insets.top + 60,
                    paddingBottom: 200
                }}
                onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
                onScrollBeginDrag={handleScrollStart}
                onMomentumScrollEnd={handleScrollStop}
                onScrollEndDrag={handleScrollStop}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={indexerState.isIndexing || isLoading}
                        onRefresh={handleRefresh}
                        tintColor={theme.accent}
                    />
                }
            >
                {topSongs.length > 0 && (
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
                    entering={FadeInRight.duration(300)}
                    exiting={FadeOutLeft.duration(300)}
                    className="px-4"
                >
                    {topSongs.length === 0 ? (
                        <EmptyState
                            icon="musical-notes-outline"
                            title="No top songs yet"
                            message={`Play some ${genreName} music to see your most played tracks here!`}
                            className="mt-12"
                        />
                    ) : (
                        <SongList data={topSongs} showNumbers />
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}
