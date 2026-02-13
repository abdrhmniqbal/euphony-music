import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { toggleFavoriteItem } from "@/modules/favorites/favorites.store";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/hooks/scroll-bars.store";
import { SortSheet } from "@/components/blocks/sort-sheet";
import { TrackList } from "@/components/blocks/track-list";
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    interpolate,
    FadeIn,
} from "react-native-reanimated";
import {
    TRACK_SORT_OPTIONS,
    type SortField,
} from "@/modules/library/library-sort.store";
import { useAlbumDetailsScreen } from "../hooks/use-album-details-screen";
import { PlaybackActionsRow } from "@/components/blocks";
import { cn } from "tailwind-variants";

export default function AlbumDetailsScreen() {
    const navigation = useNavigation();
    const router = useRouter();
    const theme = useThemeColors();

    const {
        albumInfo,
        albumId,
        isAlbumFavorite,
        tracksByDisc,
        sortedTracks,
        sortConfig,
        totalDurationLabel,
        playSelectedTrack,
        playAllTracks,
        shuffleTracks,
        selectSort,
        getSortLabel,
    } = useAlbumDetailsScreen();

    const [scrollY, setScrollY] = useState(0);
    const [sortModalVisible, setSortModalVisible] = useState(false);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    function handleSortSelect(field: SortField, order?: 'asc' | 'desc') {
        selectSort(field, order);
        if (!order) {
            setSortModalVisible(false);
        }
    }

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

    if (!albumInfo) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-muted">Album not found</Text>
            </View>
        );
    }

    return (
        <SortSheet
            visible={sortModalVisible}
            onOpenChange={setSortModalVisible}
            currentField={sortConfig.field}
            currentOrder={sortConfig.order}
            onSelect={handleSortSelect}
        >
            <View className="flex-1 bg-background">
            <Animated.View
                className="absolute top-0 left-0 right-0 z-20 pt-12 pb-3 px-4"
                style={headerAnimatedStyle}
            >
                <View className="flex-row items-center">
                    <View className="w-22 flex-row">
                        <Pressable
                            onPress={() => router.back()}
                            className={cn("w-10 h-10 rounded-full items-center justify-center active:opacity-50", getButtonBackground())}
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
                                {albumInfo.title}
                            </Text>
                        </Animated.View>
                    </View>

                    <View className="w-22 flex-row justify-end gap-3">
                        {albumId && (
                            <Pressable
                                className={cn("w-10 h-10 rounded-full items-center justify-center active:opacity-50", getButtonBackground())}
                                onPress={() => {
                                    toggleFavoriteItem(
                                        albumId,
                                        'album',
                                        albumInfo.title,
                                        albumInfo.artist,
                                        albumInfo.image
                                    );
                                }}
                            >
                                <Ionicons
                                    name={isAlbumFavorite ? "heart" : "heart-outline"}
                                    size={22}
                                    color={isAlbumFavorite ? "#ef4444" : getIconColor()}
                                />
                            </Pressable>
                        )}
                        <Pressable className={cn("w-10 h-10 rounded-full items-center justify-center active:opacity-50", getButtonBackground())}>
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
                            {albumInfo.image ? (
                                <Image
                                    source={{ uri: albumInfo.image }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            ) : (
                                <View className="w-full h-full items-center justify-center">
                                    <Ionicons name="disc" size={48} color={theme.muted} />
                                </View>
                            )}
                        </View>

                        <View className="flex-1 justify-center">
                            <Text className="text-2xl font-bold text-foreground" numberOfLines={2}>
                                {albumInfo.title}
                            </Text>
                            <Text className="text-base text-muted mt-1" numberOfLines={1}>
                                {albumInfo.artist}
                            </Text>
                            <Text className="text-sm text-muted mt-2">
                                {albumInfo.year ? `${albumInfo.year}` : ""} · {totalDurationLabel}
                            </Text>
                        </View>
                    </View>
                </View>

                <Animated.View
                    entering={FadeIn.duration(300)}
                    className="px-6"
                >
                    <PlaybackActionsRow onPlay={playAllTracks} onShuffle={shuffleTracks} />
                </Animated.View>

                <View className="px-6 flex-row items-center justify-between mb-4">
                    <Text className="text-lg font-bold text-foreground">{sortedTracks.length} Tracks</Text>
                    <SortSheet.Trigger
                        label={getSortLabel()}
                        iconSize={16}
                    />
                </View>

                <View className="px-4">
                    {Array.from(tracksByDisc.entries()).map(([discNumber, discTracks]) => (
                        <View key={discNumber}>
                            <View className="py-3 px-2 mb-2">
                                <Text className="text-sm font-bold text-muted uppercase tracking-wide">
                                    Disc {discNumber}
                                </Text>
                            </View>
                            <TrackList
                                data={discTracks}
                                showNumbers={true}
                                hideCover={true}
                                hideArtist={true}
                                getNumber={(track, index) => track.trackNumber || index + 1}
                                onTrackPress={playSelectedTrack}
                            />
                        </View>
                    ))}
                </View>
            </ScrollView>

                <SortSheet.Content options={TRACK_SORT_OPTIONS} />
            </View>
        </SortSheet>
    );
}
