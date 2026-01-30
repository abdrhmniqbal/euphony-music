import React, { useLayoutEffect, useCallback, useMemo, useState } from "react";
import { Text, View, ScrollView, Pressable, RefreshControl } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { Card } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { useStore } from "@nanostores/react";
import { startIndexing, $indexerState } from "@/utils/media-indexer";
import { getAllGenres } from "@/utils/database";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { GestureDetector } from "react-native-gesture-handler";
import { EmptyState } from "@/components/empty-state";

type PatternType = 'circles' | 'waves' | 'grid' | 'diamonds' | 'triangles' | 'rings' | 'pills';

interface Category {
    id: string;
    title: string;
    color: string;
    pattern: PatternType;
}

const RAINBOW_COLORS = [
    "bg-rainbow-lime",
    "bg-rainbow-teal",
    "bg-rainbow-cyan",
    "bg-rainbow-blue",
    "bg-rainbow-indigo",
    "bg-rainbow-purple",
    "bg-rainbow-magenta",
    "bg-rainbow-red",
    "bg-rainbow-orange",
    "bg-rainbow-amber",
] as const;

const getStableColor = (index: number): string => {
    return RAINBOW_COLORS[index % RAINBOW_COLORS.length];
};

const getStablePattern = (index: number): PatternType => {
    const patterns: PatternType[] = ['circles', 'waves', 'diamonds', 'triangles', 'rings', 'grid', 'pills'];
    return patterns[index % patterns.length];
};

interface CategoryCardProps {
    title: string;
    color: string;
    pattern: PatternType;
    onPress?: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ title, color, pattern, onPress }) => {
    return (
        <Pressable onPress={onPress} className="w-[47.5%] active:opacity-80">
            <Card className={`h-24 p-4 justify-start overflow-hidden border-none ${color} relative`}>
                <Text className="text-white font-bold text-[17px] z-10 leading-tight">{title}</Text>
                <View className="absolute inset-0 opacity-30">
                    {pattern === 'circles' && (
                        <>
                            <View className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/30" />
                            <View className="absolute left-1/2 top-1/2 w-12 h-12 rounded-full bg-white/10 -translate-x-6 -translate-y-6" />
                            <View className="absolute right-4 bottom-[-10] w-16 h-16 rounded-full bg-white/20" />
                        </>
                    )}
                    {pattern === 'waves' && (
                        <>
                            <View className="absolute -left-12 bottom-[-20] w-40 h-40 rounded-full border-20 border-white/20" />
                            <View className="absolute right-[-20] top-[-20] w-28 h-28 rounded-full border-12 border-white/20" />
                        </>
                    )}
                    {pattern === 'grid' && (
                        <View className="absolute inset-0 flex-row flex-wrap gap-2 p-1.5">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <View key={i} className="w-6 h-6 rounded-sm bg-white/10" />
                            ))}
                        </View>
                    )}
                    {pattern === 'diamonds' && (
                        <>
                            <View className="absolute right-[-10] top-4 w-16 h-16 bg-white/30 rotate-45" />
                            <View className="absolute left-[-20] bottom-0 w-24 h-24 bg-white/10 rotate-45" />
                            <View className="absolute right-10 bottom-[-15] w-12 h-12 bg-white/20 rotate-45" />
                        </>
                    )}
                    {pattern === 'triangles' && (
                        <>
                            <View className="absolute right-0 top-0 w-0 h-0 border-l-40 border-l-transparent border-t-40 border-t-white/30" />
                            <View className="absolute left-4 bottom-[-10] w-0 h-0 border-r-60 border-r-transparent border-b-60 border-b-white/15" />
                            <View className="absolute right-12 top-1/2 w-0 h-0 border-l-25 border-l-transparent border-b-25 border-b-white/20" />
                        </>
                    )}
                    {pattern === 'rings' && (
                        <>
                            <View className="absolute -right-2 -top-2 w-16 h-16 rounded-full border-4 border-white/40" />
                            <View className="absolute -right-6 -top-6 w-24 h-24 rounded-full border-4 border-white/20" />
                            <View className="absolute -left-4 bottom-2 w-12 h-12 rounded-full border-4 border-white/30" />
                        </>
                    )}
                    {pattern === 'pills' && (
                        <>
                            <View className="absolute right-0 top-2 w-20 h-8 rounded-full bg-white/30 rotate-[-15deg]" />
                            <View className="absolute -left-4 bottom-4 w-24 h-10 rounded-full bg-white/15 rotate-25" />
                            <View className="absolute right-8 bottom-[-10] w-16 h-6 rounded-full bg-white/20 rotate-10" />
                        </>
                    )}
                </View>
            </Card>
        </Pressable>
    );
};

export default function SearchScreen() {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];
    const navigation = useNavigation();
    const router = useRouter();
    const indexerState = useStore($indexerState);
    const { swipeGesture } = useSwipeNavigation('(search)');
    const [genreList, setGenreList] = useState<string[]>([]);

    const loadGenres = useCallback(() => {
        const genres = getAllGenres();
        setGenreList(genres);
    }, []);

    React.useEffect(() => {
        loadGenres();
    }, [loadGenres]);

    const onRefresh = useCallback(() => {
        startIndexing(true);
        loadGenres();
    }, [loadGenres]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Pressable
                    onPress={() => router.push("/settings")}
                    className="mr-1 active:opacity-50"
                >
                    <Ionicons name="settings-outline" size={24} color={theme.foreground} />
                </Pressable>
            ),
        });
    }, [navigation, theme, router]);

    // Convert real genres to Category format
    const genres: Category[] = useMemo(() => {
        return genreList.map((genre, i) => ({
            id: genre,
            title: genre,
            color: getStableColor(i),
            pattern: getStablePattern(i),
        }));
    }, [genreList]);

    const handleGenrePress = useCallback((genre: Category) => {
        router.push(`/genre/${encodeURIComponent(genre.title)}`);
    }, [router]);

    const handleSearchPress = useCallback(() => {
        router.push("/search-interaction");
    }, [router]);

    return (
        <GestureDetector gesture={swipeGesture}>
            <ScrollView
                className="flex-1 bg-background"
                contentContainerStyle={{ padding: 20, paddingBottom: 200 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentInsetAdjustmentBehavior="automatic"
                onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
                onScrollBeginDrag={handleScrollStart}
                onMomentumScrollEnd={handleScrollStop}
                onScrollEndDrag={handleScrollStop}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl refreshing={indexerState.isIndexing} onRefresh={onRefresh} tintColor={theme.accent} />
                }
            >
                <Pressable
                    onPress={handleSearchPress}
                    className="mb-8 p-1 bg-default/50 rounded-2xl flex-row items-center px-4 h-14 border border-default active:opacity-70"
                >
                    <Ionicons name="search-outline" size={20} color={theme.muted} />
                    <Text className="ml-3 text-[17px] text-muted font-medium">Artists, songs, lyrics...</Text>
                </Pressable>

                <View className="mb-10">
                    <Text className="text-lg font-bold text-foreground mb-4">Genres</Text>
                    {genres.length > 0 ? (
                        <View className="flex-row flex-wrap gap-x-[5%] gap-y-4">
                            {genres.map((genre) => (
                                <CategoryCard
                                    key={genre.id}
                                    title={genre.title}
                                    color={genre.color}
                                    pattern={genre.pattern}
                                    onPress={() => handleGenrePress(genre)}
                                />
                            ))}
                        </View>
                    ) : (
                        <EmptyState icon="musical-notes-outline" title="No genres found" message="Add music with genre metadata to see them here." />
                    )}
                </View>
            </ScrollView>
        </GestureDetector>
    );
}
