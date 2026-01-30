import React, { useMemo, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { playTrack, Track } from "@/store/player-store";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import { Button } from "heroui-native";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemRank } from "@/components/item";
import { SectionTitle } from "@/components/section-title";
import { getTopSongsByGenre, getAlbumsByGenre, AlbumInfo } from "@/utils/database";
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    interpolate,
    FadeIn,
} from "react-native-reanimated";

const CHUNK_SIZE = 5;

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
};

export default function GenreDetailsScreen() {
    const { name } = useLocalSearchParams<{ name: string }>();
    const navigation = useNavigation();
    const router = useRouter();
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === "dark" ? "dark" : "light"];

    const genreName = decodeURIComponent(name || "");

    // Get top songs for this genre
    const topSongs = useMemo(() => {
        return getTopSongsByGenre(genreName, 25);
    }, [genreName]);

    // Get albums for this genre
    const albums = useMemo(() => {
        return getAlbumsByGenre(genreName);
    }, [genreName]);

    const topSongsChunks = useMemo(() => chunkArray(topSongs, CHUNK_SIZE), [topSongs]);

    const [scrollY, setScrollY] = useState(0);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const handlePlayTrack = (track: Track) => {
        playTrack(track);
    };

    const handlePlayAll = () => {
        if (topSongs.length > 0) {
            playTrack(topSongs[0]);
        }
    };

    const handleShuffle = () => {
        if (topSongs.length > 0) {
            const randomIndex = Math.floor(Math.random() * topSongs.length);
            playTrack(topSongs[randomIndex]);
        }
    };

    const handleAlbumPress = (album: AlbumInfo) => {
        router.push(`/album/${encodeURIComponent(album.name)}`);
    };

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

    const renderAlbumItem = (album: AlbumInfo, index: number) => (
        <Pressable
            key={`${album.name}-${index}`}
            onPress={() => handleAlbumPress(album)}
            className="mr-4 active:opacity-70"
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

    const scrollProgress = Math.min(Math.max(scrollY / 200, 0), 1);

    const headerAnimatedStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            scrollProgress,
            [0, 1],
            ["rgba(0,0,0,0)", theme.background]
        );
        return {
            backgroundColor,
        };
    }, [scrollProgress, theme.background]);

    const headerTextAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollProgress,
            [0.5, 1],
            [0, 1],
        );
        return { opacity };
    }, [scrollProgress]);

    const getIconColor = () => {
        if (scrollY > 150) {
            return theme.foreground;
        }
        return "white";
    };

    const getButtonBackground = () => {
        if (scrollY > 150) {
            return "";
        }
        return "bg-black/30";
    };

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <Animated.View
                className="absolute top-0 left-0 right-0 z-20 pt-12 pb-3 px-4"
                style={headerAnimatedStyle}
            >
                <View className="flex-row items-center">
                    <View className="w-[88px] flex-row">
                        <Pressable
                            onPress={() => router.back()}
                            className={`w-10 h-10 rounded-full items-center justify-center active:opacity-50 ${getButtonBackground()}`}
                        >
                            <Ionicons name="chevron-back" size={24} color={getIconColor()} />
                        </Pressable>
                    </View>

                    <View className="flex-1 px-2">
                        <Animated.View style={headerTextAnimatedStyle}>
                            <Text
                                className="text-lg font-bold text-center"
                                style={{ color: theme.foreground }}
                                numberOfLines={1}
                            >
                                {genreName}
                            </Text>
                        </Animated.View>
                    </View>

                    <View className="w-[88px] flex-row justify-end gap-3">
                        <Pressable className={`w-10 h-10 rounded-full items-center justify-center active:opacity-50 ${getButtonBackground()}`}>
                            <Ionicons name="ellipsis-horizontal" size={22} color={getIconColor()} />
                        </Pressable>
                    </View>
                </View>
            </Animated.View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 200 }}
                onScroll={(e) => {
                    setScrollY(e.nativeEvent.contentOffset.y);
                    handleScroll(e.nativeEvent.contentOffset.y);
                }}
                onScrollBeginDrag={handleScrollStart}
                onMomentumScrollEnd={handleScrollStop}
                onScrollEndDrag={handleScrollStop}
                scrollEventThrottle={16}
            >
                {/* Genre Header Section */}
                <View className="px-6 pt-24 pb-6">
                    <View className="flex-row gap-4 pt-6">
                        {/* Genre Icon/Placeholder */}
                        <View className="w-36 h-36 rounded-lg overflow-hidden bg-accent/20 items-center justify-center">
                            <Ionicons name="musical-notes" size={64} color={theme.accent} />
                        </View>

                        {/* Genre Info */}
                        <View className="flex-1 justify-center">
                            <Text className="text-2xl font-bold text-foreground" numberOfLines={2}>
                                {genreName}
                            </Text>
                            <Text className="text-base text-muted mt-1">
                                {topSongs.length} songs · {albums.length} albums
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <Animated.View
                    entering={FadeIn.duration(300)}
                    className="px-6 flex-row gap-4 mb-6"
                >
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
                </Animated.View>

                {/* Top Songs Section */}
                <SectionTitle
                    title="Top Songs"
                    className="px-4 mb-2"
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
                    <View className="px-6 mb-8">
                        <Text className="text-muted">No songs with this genre</Text>
                    </View>
                )}

                {/* Albums Section */}
                <SectionTitle
                    title="Albums"
                    className="px-4 mb-2"
                />

                {albums.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                        className="mb-8"
                    >
                        {albums.map(renderAlbumItem)}
                    </ScrollView>
                ) : (
                    <View className="px-6 mb-8">
                        <Text className="text-muted">No albums with this genre</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
