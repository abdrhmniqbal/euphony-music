import { View, ScrollView, Pressable, RefreshControl, Text } from "react-native";
import { useEffect } from "react";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/empty-state";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Ionicons } from "@expo/vector-icons";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/shared/hooks/scroll-bars.store";
import { useStore } from "@nanostores/react";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { $indexerState } from "@/features/indexer";
import { AlbumGrid, Album } from "@/components/library/album-grid";
import { useGenreAlbumsScreen } from "@/features/search/use-genre-albums-screen";

export default function GenreAlbumsScreen() {
    const { name } = useLocalSearchParams<{ name: string }>();
    const navigation = useNavigation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const indexerState = useStore($indexerState);
    const theme = useThemeColors();

    const genreName = decodeURIComponent(name || "");
    const { albumData, isLoading, refresh } = useGenreAlbumsScreen(genreName);

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    function handleAlbumPress(album: Album) {
        router.push(`/(main)/(library)/album/${encodeURIComponent(album.title)}`);
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
                    {genreName} Albums
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
                <Animated.View
                    entering={FadeInRight.duration(300)}
                    exiting={FadeOutLeft.duration(300)}
                    className="px-6 py-4"
                >
                    {albumData.length === 0 ? (
                        <EmptyState
                            icon="disc-outline"
                            title="No albums found"
                            message={`No albums available in ${genreName}`}
                            className="mt-12"
                        />
                    ) : (
                        <>
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-lg font-bold text-foreground">
                                    {albumData.length} Albums
                                </Text>
                                <Pressable className="flex-row items-center gap-1 active:opacity-50">
                                    <Text className="text-sm font-medium text-muted">Year</Text>
                                    <Ionicons name="arrow-down" size={14} color={theme.muted} />
                                </Pressable>
                            </View>
                            <AlbumGrid
                                data={albumData}
                                onAlbumPress={handleAlbumPress}
                                scrollEnabled={false}
                            />
                        </>
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}
