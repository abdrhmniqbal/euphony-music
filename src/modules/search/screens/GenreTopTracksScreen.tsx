import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useEffect } from "react";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/ui";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Ionicons } from "@expo/vector-icons";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/hooks/scroll-bars.store";
import { useStore } from "@nanostores/react";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { $indexerState } from "@/modules/indexer";
import { TrackList } from "@/components/blocks/track-list";
import { useGenreTopTracksScreen } from "../hooks/use-genre-top-tracks-screen";
import { PlaybackActionsRow } from "@/components/blocks";

export default function GenreTopTracksScreen() {
    const { name } = useLocalSearchParams<{ name: string }>();
    const navigation = useNavigation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const indexerState = useStore($indexerState);
    const theme = useThemeColors();

    const genreName = decodeURIComponent(name || "");
    const { tracks, isLoading, refresh, playAll, shuffle } = useGenreTopTracksScreen(genreName);

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

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
                    {genreName} Top Tracks
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
                {tracks.length > 0 && (
                    <PlaybackActionsRow onPlay={playAll} onShuffle={shuffle} className="px-4 py-4" />
                )}

                <Animated.View
                    entering={FadeInRight.duration(300)}
                    exiting={FadeOutLeft.duration(300)}
                    className="px-4"
                >
                    {tracks.length === 0 ? (
                        <EmptyState
                            icon="musical-notes-outline"
                            title="No top tracks yet"
                            message={`Play some ${genreName} music to see your most played tracks here!`}
                            className="mt-12"
                        />
                    ) : (
                        <TrackList data={tracks} showNumbers />
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}
