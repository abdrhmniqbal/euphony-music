import React, { useState, useCallback, useEffect } from "react";
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
import { getTopSongsByGenre, getAlbumsByGenre, AlbumInfo } from "@/db/operations";
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

    // State for async data
    const [topSongs, setTopSongs] = useState<Track[]>([]);
    const [albums, setAlbums] = useState<AlbumInfo[]>([]);

    useEffect(() => {
        const loadData = async () => {
            const songs = await getTopSongsByGenre(genreName, 25);
            const albumList = await getAlbumsByGenre(genreName);
            setTopSongs(songs);
            setAlbums(albumList);
        };
        loadData();
    }, [genreName]);

    const topSongsChunks = chunkArray(topSongs, CHUNK_SIZE);

    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
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

    return (
        <View className="flex-1 bg-background">
            {/* Animated Header */}
            <Animated.View
                className="absolute top-0 left-0 right-0 z-10 pt-12 px-4 pb-4"
                style={headerAnimatedStyle}
            >
                <View className="flex-row items-center justify-between">
                    <Pressable onPress={() => router.back()} className="p-2 active:opacity-70">
                        <Ionicons name="chevron-back" size={28} color={getIconColor()} />
                    </Pressable>
                    <Animated.View style={headerTextAnimatedStyle}>
                        <Text className="text-foreground font-bold text-lg" numberOfLines={1}>
                            {genreName}
                        </Text>
                    </Animated.View>
                    <Pressable onPress={() => router.push("/settings")} className="p-2 active:opacity-70">
                        <Ionicons name="settings-outline" size={24} color={getIconColor()} />
                    </Pressable>
                </View>
            </Animated.View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 200 }}
                onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
                onScrollBeginDrag={handleScrollStart}
                onScrollEndDrag={handleScrollStop}
                scrollEventThrottle={16}
            >
                {/* Genre Header */}
                <View className="pt-20 px-4 pb-6">
                    <Text className="text-accent text-sm font-semibold uppercase tracking-wide mb-2">Genre</Text>
                    <Text className="text-foreground text-4xl font-bold mb-6">{genreName}</Text>

                    {/* Action Buttons */}
                    {topSongs.length > 0 && (
                        <View className="flex-row gap-4">
                            <Button
                                className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                                onPress={handlePlayAll}
                            >
                                <Ionicons name="play" size={20} color={theme.foreground} />
                                <Text className="text-lg font-bold text-foreground uppercase">Play All</Text>
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
                </View>

                {/* Top Songs Section */}
                {topSongs.length > 0 && (
                    <View className="mb-8">
                        <SectionTitle title="Top Songs" className="px-4 mb-4" />
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 16, gap: 24 }}
                        >
                            {topSongsChunks.map(renderTopSongsChunk)}
                        </ScrollView>
                    </View>
                )}

                {/* Albums Section */}
                {albums.length > 0 && (
                    <View className="mb-8">
                        <SectionTitle title="Albums" className="px-4 mb-4" />
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 16 }}
                        >
                            {albums.map(renderAlbumItem)}
                        </ScrollView>
                    </View>
                )}

                {/* Empty State */}
                {topSongs.length === 0 && albums.length === 0 && (
                    <View className="px-4 pt-20">
                        <Text className="text-muted text-center text-lg">
                            No songs found in this genre yet.
                        </Text>
                        <Text className="text-muted-secondary text-center mt-2">
                            Start playing some {genreName} music!
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}