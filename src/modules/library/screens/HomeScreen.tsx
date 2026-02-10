import React, { useLayoutEffect } from "react";
import { Pressable, View, ScrollView, RefreshControl } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { TrackRow } from "@/components/patterns";
import { ContentSection, MediaCarousel, RankedTrackCarousel } from "@/components/blocks";
import { $indexerState } from "@/modules/indexer";
import { playTrack, type Track } from "@/modules/player/player.store";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/hooks/scroll-bars.store";
import { useHomeScreen } from "@/modules/library/hooks/use-home-screen";

const CHUNK_SIZE = 5;

const TimeOutlineIcon = ({ size = 48, color }: { size?: number; color?: string }) => (
    <Ionicons name="time-outline" size={size} color={color} />
);

const MusicalNotesOutlineIcon = ({ size = 48, color }: { size?: number; color?: string }) => (
    <Ionicons name="musical-notes-outline" size={size} color={color} />
);

export default function HomeScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const theme = useThemeColors();
    const indexerState = useStore($indexerState);
    const { recentlyPlayedTracks, topTracks, refresh } = useHomeScreen();

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

    function renderRecentlyPlayedItem(item: Track) {
        return (
            <TrackRow
                track={item}
                variant="grid"
                onPress={() => playTrack(item, recentlyPlayedTracks)}
            />
        );
    }

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
                <RefreshControl refreshing={indexerState.isIndexing} onRefresh={refresh} tintColor={theme.accent} />
            }
        >
            <View className="pt-6">
                <ContentSection
                    title="Recently Played"
                    data={recentlyPlayedTracks}
                    onViewMore={() => router.push("/(main)/(home)/recently-played")}
                    emptyState={{
                        icon: TimeOutlineIcon,
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
                    title="Top Tracks"
                    data={topTracks}
                    onViewMore={() => router.push("/(main)/(home)/top-tracks")}
                    emptyState={{
                        icon: MusicalNotesOutlineIcon,
                        title: "No top tracks",
                        message: "Play more music together!",
                    }}
                    renderContent={(data) => (
                        <RankedTrackCarousel
                            data={data}
                            chunkSize={CHUNK_SIZE}
                        />
                    )}
                />
            </View>
        </ScrollView>
    );
}
