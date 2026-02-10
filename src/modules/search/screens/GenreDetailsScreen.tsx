import { View, ScrollView, RefreshControl, Pressable, Text } from "react-native";
import { useEffect } from "react";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/hooks/scroll-bars.store";
import { useStore } from "@nanostores/react";
import { $indexerState } from "@/modules/indexer";
import { ContentSection, MediaCarousel, RankedTrackCarousel } from "@/components/blocks";
import { MusicCard } from "@/components/patterns";
import { useGenreDetailsScreen } from "../hooks/use-genre-details-screen";
import type { GenreAlbumInfo } from "@/modules/genres/genres.api";

const CHUNK_SIZE = 5;

const MusicalNotesOutlineIcon = ({ size = 48, color }: { size?: number; color?: string }) => (
    <Ionicons name="musical-notes-outline" size={size} color={color} />
);

const DiscOutlineIcon = ({ size = 48, color }: { size?: number; color?: string }) => (
    <Ionicons name="disc-outline" size={size} color={color} />
);

export default function GenreDetailsScreen() {
    const { name } = useLocalSearchParams<{ name: string }>();
    const navigation = useNavigation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const theme = useThemeColors();
    const indexerState = useStore($indexerState);

    const genreName = decodeURIComponent(name || "");
    const { topTracks, previewAlbums, isLoading, refresh } = useGenreDetailsScreen(genreName);

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    function renderAlbumItem(album: GenreAlbumInfo) {
        const subtitle = `${album.artist || "Unknown Artist"} · ${album.trackCount} tracks`;

        return (
            <MusicCard
                title={album.name}
                subtitle={subtitle}
                image={album.image}
                icon="disc"
                onPress={() => router.push(`/(main)/(library)/album/${encodeURIComponent(album.name)}`)}
            />
        );
    }

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
                    {genreName}
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
                        onRefresh={refresh}
                        tintColor={theme.accent}
                    />
                }
            >
                <ContentSection
                    title="Top Tracks"
                    data={topTracks}
                    onViewMore={() => router.push(`./top-tracks?name=${encodeURIComponent(genreName)}`)}
                    emptyState={{
                        icon: MusicalNotesOutlineIcon,
                        title: "No top tracks",
                        message: `Play some ${genreName} music to see top tracks!`,
                    }}
                    renderContent={(data) => (
                        <RankedTrackCarousel
                            data={data}
                            chunkSize={CHUNK_SIZE}
                        />
                    )}
                />

                <ContentSection
                    title="Recommended Albums"
                    data={previewAlbums}
                    onViewMore={() => router.push(`./albums?name=${encodeURIComponent(genreName)}`)}
                    emptyState={{
                        icon: DiscOutlineIcon,
                        title: "No albums found",
                        message: `No albums available in ${genreName}`,
                    }}
                    renderContent={(data) => (
                        <MediaCarousel
                            data={data}
                            renderItem={renderAlbumItem}
                            keyExtractor={(album, index) => `${album.name}-${index}`}
                        />
                    )}
                />
            </ScrollView>
        </View>
    );
}
