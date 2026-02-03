import React, { useState, useLayoutEffect, useCallback } from "react";
import { Text, ScrollView, View, Pressable, RefreshControl } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "heroui-native";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { playTrack, $tracks, Track } from "@/store/player-store";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { useStore } from "@nanostores/react";
import { runOnJS } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { startIndexing, $indexerState } from "@/features/indexer";
import { useFavorites } from "@/store/favorites-store";
import {
    $sortConfig,
    setSortConfig,
    SONG_SORT_OPTIONS,
    ALBUM_SORT_OPTIONS,
    ARTIST_SORT_OPTIONS,
    PLAYLIST_SORT_OPTIONS,
    SortField
} from "@/store/sort-store";
import { SortSheet } from "@/components/library/sort-sheet";
import { PlaylistList, Playlist } from "@/components/library/playlist-list";
import { FolderList, Folder } from "@/components/library/folder-list";
import { FavoritesList } from "@/components/library/favorites-list";
import { SongsTab } from "@/components/library/songs-tab";
import { AlbumsTab } from "@/components/library/albums-tab";
import { ArtistsTab } from "@/components/library/artists-tab";
import { LibraryLoadingState } from "@/components/library/library-loading-state";
import { useAlbums, useArtists, usePlaylists } from "@/features/library/api/use-library";

const TABS = ["Songs", "Albums", "Artists", "Playlists", "Folders", "Favorites"] as const;
type TabType = typeof TABS[number];

const TAB_SORT_OPTIONS = {
    Songs: SONG_SORT_OPTIONS,
    Albums: ALBUM_SORT_OPTIONS,
    Artists: ARTIST_SORT_OPTIONS,
    Playlists: PLAYLIST_SORT_OPTIONS,
    Folders: [],
    Favorites: [],
};

export default function LibraryScreen() {
    const navigation = useNavigation();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("Songs");
    const theme = useThemeColors();
    const indexerState = useStore($indexerState);
    const tracks = useStore($tracks);
    const allSortConfigs = useStore($sortConfig);
    const sortConfig = allSortConfigs[activeTab];
    const [sortModalVisible, setSortModalVisible] = useState(false);
    const favorites = useFavorites();
    const { data: albumsData } = useAlbums();
    const { data: artistsData } = useArtists();

    const closeSortModal = useCallback(() => {
        setSortModalVisible(false);
    }, []);

    const navigateTab = useCallback((direction: 'left' | 'right') => {
        const currentIndex = TABS.indexOf(activeTab);
        if (direction === 'left' && currentIndex < TABS.length - 1) {
            setActiveTab(TABS[currentIndex + 1]);
        } else if (direction === 'right' && currentIndex > 0) {
            setActiveTab(TABS[currentIndex - 1]);
        }
    }, [activeTab]);

    const { swipeGesture: mainTabSwipeGesture } = useSwipeNavigation('(library)');

    const swipeGesture = Gesture.Pan()
        .activeOffsetX([-20, 20])
        .onBegin((event) => {
            const currentIndex = TABS.indexOf(activeTab);
            const isRightSwipe = event.translationX > 0;
            const isLeftSwipe = event.translationX < 0;

            if (isRightSwipe && currentIndex === 0) return;
            if (isLeftSwipe && currentIndex === TABS.length - 1) return;
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

    const handleArtistPress = useCallback((artist: { id: string; name: string }) => {
        router.push(`/artist/${encodeURIComponent(artist.name)}`);
    }, [router]);

    const handleAlbumPress = useCallback((album: { id: string; title: string }) => {
        router.push(`/album/${encodeURIComponent(album.title)}`);
    }, [router]);

    const handlePlaylistPress = useCallback((playlist: { id: string }) => {
        router.push(`/playlist/${playlist.id}`);
    }, [router]);

    const handleSongPress = useCallback((track: Track) => {
        playTrack(track);
    }, []);

    const { data: playlistsData } = usePlaylists();
    const playlists = playlistsData || [];
    const folders: Folder[] = [];

    const handlePlayAll = useCallback(() => {
        if (activeTab === "Favorites") {
            const firstTrack = favorites.find(f => f.type === 'track');
            if (firstTrack) {
                const track = tracks.find(t => t.id === firstTrack.id);
                if (track) playTrack(track);
            }
        } else if (tracks.length > 0) {
            playTrack(tracks[0]);
        }
    }, [activeTab, favorites, tracks]);

    const handleShuffle = useCallback(() => {
        if (activeTab === "Favorites") {
            const trackFavorites = favorites.filter(f => f.type === 'track');
            if (trackFavorites.length > 0) {
                const randomIndex = Math.floor(Math.random() * trackFavorites.length);
                const track = tracks.find(t => t.id === trackFavorites[randomIndex].id);
                if (track) playTrack(track);
            }
        } else if (tracks.length > 0) {
            const randomIndex = Math.floor(Math.random() * tracks.length);
            playTrack(tracks[randomIndex]);
        }
    }, [activeTab, favorites, tracks]);

    const handleSortSelect = (field: SortField, order?: 'asc' | 'desc') => {
        setSortConfig(activeTab, field, order);
        if (!order) setSortModalVisible(false);
    };

    const getSortLabel = () => {
        const options = TAB_SORT_OPTIONS[activeTab];
        const option = options.find(o => o.field === sortConfig.field);
        return option?.label || 'Sort';
    };

    const getItemCount = () => {
        switch (activeTab) {
            case "Songs": return tracks.length;
            case "Albums": return albumsData?.length || 0;
            case "Artists": return artistsData?.length || 0;
            case "Favorites": return favorites.length;
            case "Playlists": return playlists.length;
            case "Folders": return folders.length;
            default: return 0;
        }
    };

    const showPlayButtons = activeTab === "Songs" || activeTab === "Favorites";
    const currentSortOptions = TAB_SORT_OPTIONS[activeTab];

    const renderTabContent = () => {
        // Each tab handles its own loading state - no blocking here
        switch (activeTab) {
            case "Songs":
                return <SongsTab sortConfig={sortConfig} onSongPress={handleSongPress} />;
            case "Albums":
                return <AlbumsTab sortConfig={sortConfig} onAlbumPress={handleAlbumPress} />;
            case "Artists":
                return <ArtistsTab sortConfig={sortConfig} onArtistPress={handleArtistPress} />;
            case "Playlists":
                return <PlaylistList data={playlists} scrollEnabled={false} onCreatePlaylist={() => router.push('/playlist/create')} onPlaylistPress={handlePlaylistPress} />;
            case "Folders":
                return <FolderList data={folders} />;
            case "Favorites":
                return <FavoritesList data={favorites} scrollEnabled={false} />;
            default:
                return null;
        }
    };

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
                            <RefreshControl
                                refreshing={indexerState.isIndexing}
                                onRefresh={onRefresh}
                                tintColor={theme.accent}
                            />
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

                        <View className="px-4 py-4">
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
                                <Text className="text-lg font-bold text-foreground">
                                    {getItemCount()} {activeTab}
                                </Text>
                                {currentSortOptions.length > 0 && (
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
                                )}
                            </View>

                            {renderTabContent()}
                        </View>

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
