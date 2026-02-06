import React, { useLayoutEffect } from "react";
import { Pressable, View, ScrollView, RefreshControl } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription } from "@/components/item";
import { ContentSection, MediaCarousel, RankedListCarousel } from "@/components/ui";
import { $indexerState } from "@/features/indexer";
import { playTrack, type Track } from "@/features/player/player.store";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/shared/hooks/scroll-bars.store";
import { useHomeScreen } from "@/features/home/use-home-screen";

const CHUNK_SIZE = 5;

export default function HomeScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const theme = useThemeColors();
    const indexerState = useStore($indexerState);
    const { recentlyPlayedTracks, topSongs, refresh } = useHomeScreen();

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
