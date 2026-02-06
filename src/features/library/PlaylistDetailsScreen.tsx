import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Button } from "heroui-native";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/shared/hooks/scroll-bars.store";
import { SongList } from "@/components/library/song-list";
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    interpolate,
    FadeIn,
} from "react-native-reanimated";
import { formatDuration } from "@/features/library/playlist-details.service";
import { usePlaylistDetailsScreen } from "@/features/library/use-playlist-details-screen";

export default function PlaylistDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const navigation = useNavigation();
    const router = useRouter();
    const theme = useThemeColors();

    const {
        playlist,
        tracks,
        playlistImages,
        totalDuration,
        isLoading,
        isFavorite,
        playFromPlaylist,
        playAll,
        shuffle,
        toggleFavorite,
    } = usePlaylistDetailsScreen(id || "");

    const [scrollY, setScrollY] = useState(0);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

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

    if (isLoading || !playlist) {
        return (
            <View className="flex-1 bg-background items-center justify-center" />
        );
    }

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
                                {playlist.name}
                            </Text>
                        </Animated.View>
                    </View>

                    <View className="w-[88px] flex-row justify-end gap-3">
                        <Pressable
                            onPress={toggleFavorite}
                            className={`w-10 h-10 rounded-full items-center justify-center active:opacity-50 ${getButtonBackground()}`}
                        >
                            <Ionicons
                                name={isFavorite ? "heart" : "heart-outline"}
                                size={22}
                                color={isFavorite ? "#ef4444" : getIconColor()}
                            />
                        </Pressable>
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
                <View className="px-6 pt-24 pb-6">
                    <View className="flex-row gap-4 pt-6">
                        <View className="w-36 h-36 rounded-lg overflow-hidden bg-surface-secondary">
                            {playlistImages.length > 0 ? (
                                playlistImages.length >= 4 ? (
                                    <View className="flex-row flex-wrap w-full h-full">
                                        {playlistImages.slice(0, 4).map((img, i) => (
                                            <Image
                                                key={i}
                                                source={{ uri: img }}
                                                className="w-1/2 h-1/2"
                                                resizeMode="cover"
                                            />
                                        ))}
                                    </View>
                                ) : (
                                    <Image
                                        source={{ uri: playlistImages[0] }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                )
                            ) : (
                                <View className="w-full h-full items-center justify-center">
                                    <Ionicons name="musical-notes" size={48} color={theme.muted} />
                                </View>
                            )}
                        </View>

                        <View className="flex-1 justify-center">
                            <Text className="text-2xl font-bold text-foreground" numberOfLines={2}>
                                {playlist.name}
                            </Text>
                            {playlist.description ? (
                                <Text className="text-base text-muted mt-1" numberOfLines={2}>
                                    {playlist.description}
                                </Text>
                            ) : null}
                            <Text className="text-sm text-muted mt-2">
                                {tracks.length} songs · {formatDuration(totalDuration)}
                            </Text>
                        </View>
                    </View>
                </View>

                <Animated.View
                    entering={FadeIn.duration(300)}
                    className="px-6 flex-row gap-4 mb-6"
                >
                    <Button
                        className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                        onPress={playAll}
                    >
                        <Ionicons name="play" size={20} color={theme.foreground} />
                        <Text className="text-lg font-bold text-foreground uppercase">Play</Text>
                    </Button>
                    <Button
                        className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                        onPress={shuffle}
                    >
                        <Ionicons name="shuffle" size={20} color={theme.foreground} />
                        <Text className="text-lg font-bold text-foreground uppercase">Shuffle</Text>
                    </Button>
                </Animated.View>

                <View className="px-4">
                    <SongList
                        data={tracks}
                        showNumbers={false}
                        hideCover={false}
                        hideArtist={false}
                        onSongPress={(track) => playFromPlaylist(track.id)}
                    />
                </View>
            </ScrollView>
        </View>
    );
}
