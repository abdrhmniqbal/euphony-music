import React, { useState, useLayoutEffect, useCallback } from "react";
import { Text, ScrollView, View, Pressable, RefreshControl, Dimensions } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "heroui-native";
import { AlbumGrid, Album } from "@/components/library/album-grid";
import { ArtistGrid, Artist } from "@/components/library/artist-grid";
import { PlaylistList, Playlist } from "@/components/library/playlist-list";
import { FolderList, Folder } from "@/components/library/folder-list";
import { SongList } from "@/components/library/song-list";
import { FavoritesList } from "@/components/library/favorites-list";
import { EmptyState } from "@/components/empty-state";
import { useFavorites } from "@/store/favorites-store";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import { playTrack, $tracks, Track } from "@/store/player-store";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { useStore } from "@nanostores/react";
import Animated, {
    FadeInRight,
    FadeOutLeft,
    runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { startIndexing, $indexerState } from "@/features/indexer";
import {
    $sortConfig,
    setSortConfig,
    sortTracks,
    sortAlbums,
    sortArtists,
    sortGenres,
    sortGeneric,
    SONG_SORT_OPTIONS,
    ALBUM_SORT_OPTIONS,
    ARTIST_SORT_OPTIONS,
    PLAYLIST_SORT_OPTIONS,
    GENRE_SORT_OPTIONS,
    SortField
} from "@/store/sort-store";
import { SortSheet } from "@/components/library/sort-sheet";

const TABS = ["Songs", "Albums", "Artists", "Playlists", "Folders", "Favorites"] as const;
type TabType = typeof TABS[number];

export default function LibraryScreen() {
    const navigation = useNavigation();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("Songs");
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];
    const indexerState = useStore($indexerState);
    const tracks = useStore($tracks);
    const allSortConfigs = useStore($sortConfig);
    const sortConfig = allSortConfigs[activeTab];
    const [sortModalVisible, setSortModalVisible] = useState(false);
    const favorites = useFavorites();

    const closeSortModal = useCallback(() => {
        setSortModalVisible(false);
    }, []);

    const sortedTracks = tracks;

    const navigateTab = useCallback((direction: 'left' | 'right') => {
        const currentIndex = TABS.indexOf(activeTab);
        if (direction === 'left' && currentIndex < TABS.length - 1) {
            setActiveTab(TABS[currentIndex + 1]);
        } else if (direction === 'right' && currentIndex > 0) {
            setActiveTab(TABS[currentIndex - 1]);
        }
    }, [activeTab]);

    const { swipeGesture: mainTabSwipeGesture } = useSwipeNavigation('(library)');

    // Inner gesture for library tabs - configured to fail when at edges
    // so the outer gesture (main tab navigation) can take over
    const swipeGesture = Gesture.Pan()
        .activeOffsetX([-20, 20])
        .onBegin((event) => {
            // Check at gesture start if we should handle this
            const currentIndex = TABS.indexOf(activeTab);
            const isRightSwipe = event.translationX > 0;
            const isLeftSwipe = event.translationX < 0;
            
            // At edges, we should NOT activate so outer gesture can handle it
            if (isRightSwipe && currentIndex === 0) {
                // At Songs tab (first), right swipe should go to Search
                // Don't activate this gesture
                return;
            }
            if (isLeftSwipe && currentIndex === TABS.length - 1) {
                // At Favorites tab (last), left swipe would go nowhere
                // Don't activate this gesture
                return;
            }
        })
        .onEnd((event) => {
            if (Math.abs(event.translationX) > Math.abs(event.translationY)) {
                const currentIndex = TABS.indexOf(activeTab);
                
                if (event.translationX > 50 && currentIndex > 0) {
                    runOnJS(navigateTab)('right');
                } else if (event.translationX < -50 && currentIndex < TABS.length - 1) {
                    runOnJS(navigateTab)('left');
                }
            }
        });

    // Race: inner gesture tries first, if it fails (at edges), outer gesture runs
    const tabSwipeGesture = Gesture.Race(swipeGesture, mainTabSwipeGesture);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View className="flex-row gap-4 mr-1">
                    <Pressable
                        onPress={() => router.push("/search-interaction")}
                        className="active:opacity-50"
                    >
                        <Ionicons name="search-outline" size={24} color={theme.foreground} />
                    </Pressable>
                    <Pressable className="active:opacity-50" onPress={() => router.push("/settings")}>
                        <Ionicons name="settings-outline" size={24} color={theme.foreground} />
                    </Pressable>
                </View>
            ),
        });
    }, [navigation, theme, router]);

    const onRefresh = useCallback(() => {
        startIndexing(true);
    }, []);

    const handleArtistPress = useCallback((artist: Artist) => {
        router.push(`/artist/${encodeURIComponent(artist.name)}`);
    }, [router]);

    const handleAlbumPress = useCallback((album: Album) => {
        router.push(`/album/${encodeURIComponent(album.title)}`);
    }, [router]);

    const albums: Album[] = (() => {
        const albumMap = new Map<string, Album & { year: number; dateAdded: number; trackCount: number }>();
        tracks.forEach(track => {
            const albumName = track.album || "Unknown Album";
            const existing = albumMap.get(albumName);

            const trackYear = track.year || 0;
            const trackDate = track.dateAdded || 0;

            if (existing) {
                existing.trackCount++;
                existing.year = Math.max(existing.year, trackYear);
                existing.dateAdded = Math.max(existing.dateAdded, trackDate);
            } else {
                albumMap.set(albumName, {
                    id: albumName,
                    title: albumName,
                    artist: track.artist || "Unknown Artist",
                    albumArtist: track.albumArtist,
                    image: track.image,
                    year: trackYear,
                    dateAdded: trackDate,
                    trackCount: 1,
                });
            }
        });
        return Array.from(albumMap.values());
    })();

    const artists: Artist[] = (() => {
        const artistMap = new Map<string, { name: string; count: number; image?: string; dateAdded: number }>();
        tracks.forEach(track => {
            const artistName = track.artist || "Unknown Artist";
            const existing = artistMap.get(artistName);
            const trackDate = track.dateAdded || 0;

            if (existing) {
                existing.count++;
                existing.dateAdded = Math.max(existing.dateAdded, trackDate);
            } else {
                artistMap.set(artistName, {
                    name: artistName,
                    count: 1,
                    image: track.image,
                    dateAdded: trackDate
                });
            }
        });
        return Array.from(artistMap.values()).map(a => ({
            id: a.name,
            name: a.name,
            trackCount: a.count,
            image: a.image,
            dateAdded: a.dateAdded,
        }));
    })();

    const playlists: Playlist[] = [];
    const folders: Folder[] = [];

    const { sortedData, currentSortOptions } = (() => {
        let data: any[] = [];
        let options: { label: string; field: SortField }[] = SONG_SORT_OPTIONS;

        switch (activeTab) {
            case "Albums":
                data = sortAlbums(albums, sortConfig);
                options = ALBUM_SORT_OPTIONS;
                break;
            case "Artists":
                data = sortArtists(artists, sortConfig);
                options = ARTIST_SORT_OPTIONS;
                break;
            case "Playlists":
                data = sortGeneric(playlists, sortConfig);
                options = PLAYLIST_SORT_OPTIONS;
                break;
            case "Folders":
                data = folders;
                options = [];
                break;
            case "Favorites":
                data = favorites;
                options = [];
                break;
            default:
                data = sortTracks(sortedTracks, sortConfig);
                options = SONG_SORT_OPTIONS;
                break;
        }

        return { sortedData: data, currentSortOptions: options as any[] };
    })();

    const handlePlayAll = useCallback(() => {
        if (activeTab === "Favorites") {
            // Play first track from favorites if available
            const firstTrack = favorites.find(f => f.type === 'track');
            if (firstTrack) {
                const track = tracks.find(t => t.id === firstTrack.id);
                if (track) playTrack(track);
            }
        } else if (sortedData.length > 0) {
            playTrack(sortedData[0]);
        }
    }, [activeTab, favorites, sortedData, tracks]);

    const handleShuffle = useCallback(() => {
        if (activeTab === "Favorites") {
            const trackFavorites = favorites.filter(f => f.type === 'track');
            if (trackFavorites.length > 0) {
                const randomIndex = Math.floor(Math.random() * trackFavorites.length);
                const track = tracks.find(t => t.id === trackFavorites[randomIndex].id);
                if (track) playTrack(track);
            }
        } else if (sortedData.length > 0) {
            const randomIndex = Math.floor(Math.random() * sortedData.length);
            playTrack(sortedData[randomIndex]);
        }
    }, [activeTab, favorites, sortedData, tracks]);

    const handleSortSelect = (field: SortField, order?: 'asc' | 'desc') => {
        setSortConfig(activeTab, field, order);
        if (!order) setSortModalVisible(false);
    };

    const getSortLabel = () => {
        const option = currentSortOptions.find(o => o.field === sortConfig.field);
        return option?.label || 'Sort';
    };



    const showPlayButtons = activeTab === "Songs" || activeTab === "Favorites";

    return (
        <>
            <GestureDetector gesture={tabSwipeGesture}>
            <View className="flex-1 bg-background">
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 200 }}
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
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 24 }}
                        className="py-4 grow-0"
                    >
                        {TABS.map((tab) => (
                            <Pressable
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                className="active:opacity-50 py-2"
                            >
                                <Text className={`text-xl font-bold ${activeTab === tab ? 'text-foreground' : 'text-muted'}`}>
                                    {tab}
                                </Text>
                                {activeTab === tab && (
                                    <View className="h-1 bg-accent rounded-full mt-1" />
                                )}
                            </Pressable>
                        ))}
                    </ScrollView>

                    <Animated.View
                        key={activeTab}
                        entering={FadeInRight.duration(300)}
                        exiting={FadeOutLeft.duration(300)}
                        className="px-4 py-4"
                    >
                        {showPlayButtons && (
                            <View className="flex-row gap-4 mb-6">
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
                            </View>
                        )}
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-lg font-bold text-foreground">{sortedData.length} {activeTab}</Text>
                            <Pressable
                                className="flex-row items-center gap-1 active:opacity-50"
                                onPress={() => setSortModalVisible(true)}
                                disabled={currentSortOptions.length === 0}
                            >
                                <Text className="text-sm font-medium text-muted">{getSortLabel()}</Text>
                                <Ionicons
                                    name={sortConfig.order === 'asc' ? 'arrow-up' : 'arrow-down'}
                                    size={16}
                                    color={theme.muted}
                                />
                            </Pressable>
                        </View>

                        {(() => {
                            switch (activeTab) {
                                case "Albums": return <AlbumGrid data={sortedData} onAlbumPress={handleAlbumPress} />;
                                case "Artists": return <ArtistGrid data={sortedData} onArtistPress={handleArtistPress} />;
                                case "Playlists": return <PlaylistList data={sortedData} />;
                                case "Folders": return <FolderList data={sortedData} />;
                                case "Favorites": return <FavoritesList data={favorites} />;
                                default: return <SongList data={sortedData} />;
                            }
                        })()}
                    </Animated.View>

                    <View style={{ height: 160 }} />
                </ScrollView>
            </View>
            </GestureDetector>

            <SortSheet
                visible={sortModalVisible}
                onClose={closeSortModal}
                options={currentSortOptions}
                currentField={sortConfig.field}
                currentOrder={sortConfig.order}
                onSelect={handleSortSelect}
            />
        </>
    );
}
