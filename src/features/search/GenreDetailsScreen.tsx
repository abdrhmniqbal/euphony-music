import { View, ScrollView, RefreshControl, Image, Pressable, Text } from "react-native";
import { useEffect } from "react";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/shared/hooks/scroll-bars.store";
import { useStore } from "@nanostores/react";
import { $indexerState } from "@/features/indexer";
import { ContentSection, MediaCarousel, RankedListCarousel } from "@/components/ui";
import { useGenreDetailsScreen } from "@/features/search/use-genre-details-screen";
import type { GenreAlbumInfo } from "@/features/search/search.service";

const CHUNK_SIZE = 5;

export default function GenreDetailsScreen() {
    const { name } = useLocalSearchParams<{ name: string }>();
    const navigation = useNavigation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const theme = useThemeColors();
    const indexerState = useStore($indexerState);

    const genreName = decodeURIComponent(name || "");
    const { topSongs, previewAlbums, isLoading, refresh } = useGenreDetailsScreen(genreName);

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    function renderAlbumItem(album: GenreAlbumInfo) {
        return (
            <Pressable
                onPress={() => router.push(`/(main)/(library)/album/${encodeURIComponent(album.name)}`)}
                className="active:opacity-70"
            >
                <View className="w-36 h-36 rounded-lg overflow-hidden bg-surface-secondary mb-2">
                    {album.image ? (
                        <Image
                            source={{ uri: album.image }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full items-center justify-center">
                            <Ionicons name="disc" size={48} color={theme.muted} />
                        </View>
                    )}
                </View>
                <Text className="text-sm font-bold text-foreground w-36" numberOfLines={1}>
                    {album.name}
                </Text>
                <Text className="text-xs text-muted w-36" numberOfLines={1}>
                    {album.artist || "Unknown Artist"} · {album.trackCount} songs
                </Text>
            </Pressable>
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
                    title="Top Songs"
                    data={topSongs}
                    onViewMore={() => router.push(`./top-songs?name=${encodeURIComponent(genreName)}`)}
                    emptyState={{
                        icon: "musical-notes-outline",
                        title: "No top songs",
                        message: `Play some ${genreName} music to see top songs!`,
                    }}
                    renderContent={(data) => (
                        <RankedListCarousel
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
                        icon: "disc-outline",
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
