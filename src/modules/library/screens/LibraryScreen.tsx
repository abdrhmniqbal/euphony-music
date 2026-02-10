import React, { useLayoutEffect } from "react";
import { Text, ScrollView, View, Pressable, RefreshControl } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/hooks/scroll-bars.store";
import { GestureDetector } from "react-native-gesture-handler";
import { cn } from "tailwind-variants";

import { SortSheet } from "@/components/blocks/sort-sheet";
import { PlaylistList } from "@/components/blocks/playlist-list";
import { FolderList } from "@/components/blocks/folder-list";
import { FavoritesList } from "@/components/blocks/favorites-list";
import { TracksTab } from "@/components/blocks/tracks-tab";
import { AlbumsTab } from "@/components/blocks/albums-tab";
import { ArtistsTab } from "@/components/blocks/artists-tab";
import {
    LIBRARY_TABS,
    LIBRARY_TAB_SORT_OPTIONS,
    useLibraryScreen,
} from "../hooks/use-library-screen";
import { PlaybackActionsRow } from "@/components/blocks";

export default function LibraryScreen() {
    const navigation = useNavigation();
    const router = useRouter();
    const theme = useThemeColors();

    const {
        activeTab,
        setActiveTab,
        sortModalVisible,
        setSortModalVisible,
        closeSortModal,
        swipeGesture,
        indexerState,
        sortConfig,
        favorites,
        playlists,
        folders,
        refresh,
        openArtist,
        openAlbum,
        openPlaylist,
        openCreatePlaylist,
        playSingleTrack,
        playAll,
        shuffle,
        handleSortSelect,
        getSortLabel,
        getItemCount,
    } = useLibraryScreen();

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

    const showPlayButtons = activeTab === "Tracks" || activeTab === "Favorites";
    const currentSortOptions = LIBRARY_TAB_SORT_OPTIONS[activeTab];

    function renderTabContent() {
        switch (activeTab) {
            case "Tracks":
                return <TracksTab sortConfig={sortConfig} onTrackPress={playSingleTrack} />;
            case "Albums":
                return <AlbumsTab sortConfig={sortConfig} onAlbumPress={(album) => openAlbum(album.title)} />;
            case "Artists":
                return <ArtistsTab sortConfig={sortConfig} onArtistPress={(artist) => openArtist(artist.name)} />;
            case "Playlists":
                return (
                    <PlaylistList
                        data={playlists}
                        scrollEnabled={false}
                        onCreatePlaylist={openCreatePlaylist}
                        onPlaylistPress={(playlist) => openPlaylist(playlist.id)}
                    />
                );
            case "Folders":
                return <FolderList data={folders} />;
            case "Favorites":
                return <FavoritesList data={favorites} scrollEnabled={false} />;
            default:
                return null;
        }
    }

    return (
        <>
            <GestureDetector gesture={swipeGesture}>
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
                                onRefresh={refresh}
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
                            {LIBRARY_TABS.map((tab) => (
                                <Pressable
                                    key={tab}
                                    onPress={() => setActiveTab(tab)}
                                    className="active:opacity-50 py-2"
                                >
                                    <Text className={cn("text-xl font-bold", activeTab === tab ? "text-foreground" : "text-muted")}>
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
                                <PlaybackActionsRow onPlay={playAll} onShuffle={shuffle} />
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
