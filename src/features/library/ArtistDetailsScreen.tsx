import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Image, Dimensions } from "react-native";
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    interpolate,
    FadeIn,
    SlideInRight,
    SlideInLeft
} from "react-native-reanimated";
import { useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/shared/hooks/scroll-bars.store";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { LinearGradient } from "expo-linear-gradient";
import { SectionTitle } from "@/components/section-title";
import { Button } from "heroui-native";
import { SongList } from "@/components/library/song-list";
import { SONG_SORT_OPTIONS, ALBUM_SORT_OPTIONS, type SortField } from "@/features/library/library-sort.store";
import { AlbumGrid } from "@/components/library/album-grid";
import { Album } from "@/components/library/album-grid";
import { SortSheet } from "@/components/library/sort-sheet";
import { toggleFavoriteItem } from "@/features/favorites/favorites.store";
import { useArtistDetailsScreen } from "@/features/library/use-artist-details-screen";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ArtistDetailsScreen() {
    const navigation = useNavigation();
    const router = useRouter();
    const theme = useThemeColors();

    const {
        name,
        artistTracks,
        artistId,
        artistImage,
        isArtistFavorite,
        albums,
        sortedArtistTracks,
        popularTracks,
        sortedAlbums,
        activeView,
        navDirection,
        sortModalVisible,
        setSortModalVisible,
        sortConfig,
        navigateTo,
        playArtistTrack,
        playAllTracks,
        shuffleTracks,
        openAlbum,
        selectSort,
        getSortLabel,
    } = useArtistDetailsScreen();

    const [scrollY, setScrollY] = useState(0);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    function handleSortSelect(field: SortField, order?: 'asc' | 'desc') {
        selectSort(field, order);
    }

    const scrollProgress = Math.min(Math.max(scrollY / (SCREEN_WIDTH - 80), 0), 1);

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
        if (scrollY > SCREEN_WIDTH - 80) {
            return theme.foreground;
        }
        return "white";
    };

    const getButtonBackground = () => {
        if (scrollY > SCREEN_WIDTH - 80) {
            return "";
        }
        return "bg-black/30";
    };

    return (
        <View className="flex-1 bg-background">
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
                                {name}
                            </Text>
                        </Animated.View>
                    </View>

                    <View className="w-[88px] flex-row justify-end gap-3">
                        {artistId && (
                            <Pressable
                                className={`w-10 h-10 rounded-full items-center justify-center active:opacity-50 ${getButtonBackground()}`}
                                onPress={() => {
                                    toggleFavoriteItem(
                                        artistId,
                                        'artist',
                                        name || '',
                                        `${artistTracks.length} songs`,
                                        artistImage
                                    );
                                }}
                            >
                                <Ionicons
                                    name={isArtistFavorite ? "heart" : "heart-outline"}
                                    size={22}
                                    color={isArtistFavorite ? "#ef4444" : getIconColor()}
                                />
                            </Pressable>
                        )}
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
                <View style={{ height: SCREEN_WIDTH }} className="relative">
                    {artistImage ? (
                        <Image
                            source={{ uri: artistImage }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full bg-surface-secondary items-center justify-center">
                            <Ionicons name="person" size={120} color={theme.muted} />
                        </View>
                    )}

                    <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.7)", theme.background]}
                        locations={[0.3, 0.7, 1]}
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: "60%",
                        }}
                    />

                    <View className="absolute bottom-8 left-6 right-6">
                        <Text className="text-4xl font-bold text-white mb-2">
                            {name}
                        </Text>
                        <Text className="text-base text-white/70">
                            {artistTracks.length} songs
                        </Text>
                    </View>
                </View>

                <Animated.View
                    key={activeView}
                    entering={
                        activeView === "overview"
                            ? (navDirection === "back" ? SlideInLeft.duration(200) : FadeIn.duration(200))
                            : SlideInRight.duration(200)
                    }
                    className={activeView === "overview" ? "pt-4" : "px-6 pt-4"}
                >
                    {activeView === "overview" ? (
                        <>
                            <View className="px-6">
                                <SectionTitle
                                    title="Songs"
                                    onViewMore={() => navigateTo("songs")}
                                />

                                <SongList
                                    data={popularTracks}
                                    onSongPress={playArtistTrack}
                                />
                            </View>

                            {albums.length > 0 && (
                                <View className="mt-8 px-6">
                                    <SectionTitle
                                        title="Albums"
                                        onViewMore={() => navigateTo("albums")}
                                    />

                                    <AlbumGrid
                                        horizontal
                                        data={albums.map(album => ({ ...album, id: album.title } as Album))}
                                        onAlbumPress={openAlbum}
                                    />
                                </View>
                            )}
                        </>
                    ) : activeView === "songs" ? (
                        <>
                            <View className="flex-row items-center justify-between mb-6">
                                <View className="flex-row items-center gap-3">
                                    <Pressable
                                        onPress={() => navigateTo("overview")}
                                        className="mr-2"
                                    >
                                        <Ionicons name="chevron-back" size={20} color={theme.muted} />
                                    </Pressable>
                                    <Text className="text-lg font-bold text-foreground">All Songs</Text>
                                </View>

                                <Pressable
                                    className="flex-row items-center gap-1 active:opacity-50"
                                    onPress={() => setSortModalVisible(true)}
                                >
                                    <Text className="text-sm font-medium text-muted">{getSortLabel()}</Text>
                                    <Ionicons name={sortConfig.order === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} color={theme.muted} />
                                </Pressable>
                            </View>

                            <View className="flex-row gap-4 mb-6">
                                <Button
                                    className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                                    onPress={playAllTracks}
                                >
                                    <Ionicons name="play" size={20} color={theme.foreground} />
                                    <Text className="text-lg font-bold text-foreground uppercase">Play</Text>
                                </Button>
                                <Button
                                    className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                                    onPress={shuffleTracks}
                                >
                                    <Ionicons name="shuffle" size={20} color={theme.foreground} />
                                    <Text className="text-lg font-bold text-foreground uppercase">Shuffle</Text>
                                </Button>
                            </View>

                            <SongList data={sortedArtistTracks} />
                        </>
                    ) : (
                        <>
                            <View className="flex-row items-center justify-between mb-6">
                                <View className="flex-row items-center gap-3">
                                    <Pressable
                                        onPress={() => navigateTo("overview")}
                                        className="mr-2"
                                    >
                                        <Ionicons name="chevron-back" size={20} color={theme.muted} />
                                    </Pressable>
                                    <Text className="text-lg font-bold text-foreground">All Albums</Text>
                                </View>

                                <Pressable
                                    className="flex-row items-center gap-1 active:opacity-50"
                                    onPress={() => setSortModalVisible(true)}
                                >
                                    <Text className="text-sm font-medium text-muted">{getSortLabel()}</Text>
                                    <Ionicons name={sortConfig.order === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} color={theme.muted} />
                                </Pressable>
                            </View>

                            <AlbumGrid data={sortedAlbums} onAlbumPress={openAlbum} scrollEnabled={false} />
                        </>
                    )}
                </Animated.View>
            </ScrollView>

            <SortSheet
                visible={sortModalVisible}
                onClose={() => setSortModalVisible(false)}
                options={activeView === "songs" ? SONG_SORT_OPTIONS : activeView === "albums" ? ALBUM_SORT_OPTIONS : []}
                currentField={sortConfig.field}
                currentOrder={sortConfig.order}
                onSelect={handleSortSelect}
            />
        </View>
    );
}
