import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { $tracks, playTrack, Track } from "@/store/player-store";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import { Button } from "heroui-native";
import { useIsFavorite, toggleFavoriteItem } from "@/store/favorites-store";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { SortSheet } from "@/components/library/sort-sheet";
import { SongList } from "@/components/library/song-list";
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    interpolate,
    FadeIn,
} from "react-native-reanimated";
import {
    $sortConfig,
    setSortConfig,
    SONG_SORT_OPTIONS,
    SortField
} from "@/store/sort-store";

function formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
}

// Sort tracks by disc number, then track number
function sortByDiscAndTrack(tracks: Track[]): Track[] {
    return [...tracks].sort((a, b) => {
        const discA = a.discNumber || 1;
        const discB = b.discNumber || 1;
        
        if (discA !== discB) {
            return discA - discB;
        }
        
        const trackA = a.trackNumber || 0;
        const trackB = b.trackNumber || 0;
        
        if (trackA !== trackB) {
            return trackA - trackB;
        }
        
        // Fallback to title if track numbers are equal or missing
        return a.title.localeCompare(b.title);
    });
}

// Group tracks by disc number
function groupTracksByDisc(tracks: Track[]): Map<number, Track[]> {
    const groups = new Map<number, Track[]>();
    
    for (const track of tracks) {
        const discNumber = track.discNumber || 1;
        if (!groups.has(discNumber)) {
            groups.set(discNumber, []);
        }
        groups.get(discNumber)!.push(track);
    }
    
    return groups;
}

export default function AlbumDetailsScreen() {
    const { name } = useLocalSearchParams<{ name: string }>();
    const navigation = useNavigation();
    const router = useRouter();
    const tracks = useStore($tracks);
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === "dark" ? "dark" : "light"];
    const allSortConfigs = useStore($sortConfig);

    const albumName = decodeURIComponent(name || "");

    // Get all tracks for this album
    const albumTracks = tracks.filter(
        (t) => t.album?.toLowerCase() === albumName.toLowerCase()
    );

    // Get album info from first track
    const albumInfo = (() => {
        if (albumTracks.length === 0) return null;
        const firstTrack = albumTracks[0];
        return {
            title: firstTrack.album || "Unknown Album",
            artist: firstTrack.albumArtist || firstTrack.artist || "Unknown Artist",
            image: firstTrack.image,
            year: firstTrack.year,
        };
    })();

    // Calculate total duration
    const totalDuration = albumTracks.reduce((sum, track) => sum + (track.duration || 0), 0);

    // Sort configuration for album songs
    const sortConfig = allSortConfigs["AlbumSongs"] || { field: 'title' as SortField, order: 'asc' as const };
    
    // Sort tracks - use disc/track order by default, otherwise use user sort preference
    const sortedTracks = (() => {
        // If user has selected a non-default sort, use that
        if (sortConfig.field !== 'title' || sortConfig.order !== 'asc') {
            // Import sortTracks dynamically or create local version
            const { sortTracks } = require('@/store/sort-store');
            return sortTracks(albumTracks, sortConfig);
        }
        // Default: sort by disc then track number
        return sortByDiscAndTrack(albumTracks);
    })();

    // Group tracks by disc for display
    const tracksByDisc = groupTracksByDisc(sortedTracks);

    const isAlbumFavorite = useIsFavorite(albumName);
    const [scrollY, setScrollY] = useState(0);
    const [sortModalVisible, setSortModalVisible] = useState(false);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const handlePlayTrack = (track: Track) => {
        playTrack(track);
    };

    const handlePlayAll = () => {
        if (sortedTracks.length > 0) {
            playTrack(sortedTracks[0]);
        }
    };

    const handleShuffle = () => {
        if (sortedTracks.length > 0) {
            const randomIndex = Math.floor(Math.random() * sortedTracks.length);
            playTrack(sortedTracks[randomIndex]);
        }
    };

    const handleSortSelect = useCallback((field: SortField, order?: 'asc' | 'desc') => {
        setSortConfig("AlbumSongs", field, order);
        if (!order) setSortModalVisible(false);
    }, []);

    const getSortLabel = useCallback(() => {
        const option = SONG_SORT_OPTIONS.find(o => o.field === sortConfig.field);
        return option?.label || 'Sort';
    }, [sortConfig.field]);

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
                                {albumInfo.title}
                            </Text>
                        </Animated.View>
                    </View>

                    <View className="w-[88px] flex-row justify-end gap-3">
                        <Pressable
                            className={`w-10 h-10 rounded-full items-center justify-center active:opacity-50 ${getButtonBackground()}`}
                            onPress={() => {
                                toggleFavoriteItem(
                                    albumName,
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
                {/* Album Header Section */}
                <View className="px-6 pt-24 pb-6">
                    <View className="flex-row gap-4 pt-6">
                        {/* Album Cover */}
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

                        {/* Album Info */}
                        <View className="flex-1 justify-center">
                            <Text className="text-2xl font-bold text-foreground" numberOfLines={2}>
                                {albumInfo.title}
                            </Text>
                            <Text className="text-base text-muted mt-1" numberOfLines={1}>
                                {albumInfo.artist}
                            </Text>
                            <Text className="text-sm text-muted mt-2">
                                {albumInfo.year ? `${albumInfo.year}` : ""} · {formatDuration(totalDuration)}
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

                {/* Track List Header - Same design as Library */}
                <View className="px-6 flex-row items-center justify-between mb-4">
                    <Text className="text-lg font-bold text-foreground">{sortedTracks.length} Songs</Text>
                    <Pressable
                        className="flex-row items-center gap-1 active:opacity-50"
                        onPress={() => setSortModalVisible(true)}
                    >
                        <Text className="text-sm font-medium text-muted">{getSortLabel()}</Text>
                        <Ionicons
                            name={sortConfig.order === 'asc' ? 'arrow-up' : 'arrow-down'}
                            size={16}
                            color={theme.muted}
                        />
                    </Pressable>
                </View>

                {/* Track List grouped by disc */}
                <View className="px-4">
                    {Array.from(tracksByDisc.entries()).map(([discNumber, discTracks]) => (
                        <View key={discNumber}>
                            {/* Disc header - always shown for consistency */}
                            <View className="py-3 px-2 mb-2">
                                <Text className="text-sm font-bold text-muted uppercase tracking-wide">
                                    Disc {discNumber}
                                </Text>
                            </View>
                            {/* Tracks for this disc */}
                            <SongList
                                data={discTracks}
                                showNumbers={true}
                                hideCover={true}
                                hideArtist={true}
                                getNumber={(track, index) => track.trackNumber || index + 1}
                                onSongPress={handlePlayTrack}
                            />
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Sort Sheet */}
            <SortSheet
                visible={sortModalVisible}
                onClose={() => setSortModalVisible(false)}
                options={SONG_SORT_OPTIONS}
                currentField={sortConfig.field}
                currentOrder={sortConfig.order}
                onSelect={handleSortSelect}
            />
        </View>
    );
}
