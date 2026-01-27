import React, { useState, useLayoutEffect } from "react";
import { Text, ScrollView, View, Pressable, LayoutAnimation } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "heroui-native";
import { AlbumGrid } from "@/components/library/album-grid";
import { ArtistGrid } from "@/components/library/artist-grid";
import { PlaylistList } from "@/components/library/playlist-list";
import { FolderList } from "@/components/library/folder-list";
import { SongList } from "@/components/library/song-list";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import { playTrack } from "@/store/player-store";
import { handleScrollStart, handleScrollStop } from "@/store/ui-store";

import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";

const TABS = ["Songs", "Albums", "Artists", "Playlists", "Folders", "Favorites"] as const;
type TabType = typeof TABS[number];



export default function LibraryScreen() {
    const navigation = useNavigation();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("Songs");
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];
    const [searchQuery, setSearchQuery] = useState("");

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
    }, [navigation, theme]);

    const libraryMusic = [
        { title: "Midnight City", artist: "M83" },
        { title: "Starboy", artist: "The Weeknd" },
        { title: "Instant Destiny", artist: "Tame Impala" },
        { title: "After Hours", artist: "The Weeknd" },
        { title: "Blinding Lights", artist: "The Weeknd" },
        { title: "Levitating", artist: "Dua Lipa" },
    ];

    const libraryAlbums = [
        { title: "Dawn FM", artist: "The Weeknd" },
        { title: "Future Nostalgia", artist: "Dua Lipa" },
        { title: "Planet Her", artist: "Doja Cat" },
        { title: "SOUR", artist: "Olivia Rodrigo" },
        { title: "Justice", artist: "Justin Bieber" },
        { title: "Montero", artist: "Lil Nas X" },
    ];

    const libraryArtists = [
        { name: "The Weeknd", tracks: "15 tracks" },
        { name: "Dua Lipa", tracks: "12 tracks" },
        { name: "Doja Cat", tracks: "10 tracks" },
        { name: "Olivia Rodrigo", tracks: "11 tracks" },
        { name: "Justin Bieber", tracks: "14 tracks" },
        { name: "Lil Nas X", tracks: "9 tracks" },
    ];

    const libraryPlaylists = [
        { title: "Driving Mode", count: "50 songs" },
        { title: "Chill Vibes", count: "30 songs" },
        { title: "Workout Mix", count: "45 songs" },
        { title: "Sleep", count: "20 songs" },
    ];

    const libraryFolders = [
        { name: "Downloads", count: "120 files" },
        { name: "Music", count: "350 files" },
        { name: "Recordings", count: "15 files" },
    ];

    const getDataForTab = () => {
        switch (activeTab) {
            case "Albums": return libraryAlbums;
            case "Artists": return libraryArtists;
            case "Playlists": return libraryPlaylists;
            case "Folders": return libraryFolders;
            case "Favorites": return libraryMusic; // Reuse for now
            default: return libraryMusic;
        }
    };

    const currentData = getDataForTab();

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentInsetAdjustmentBehavior="automatic"
                onScrollBeginDrag={handleScrollStart}
                onMomentumScrollEnd={handleScrollStop}
                onScrollEndDrag={handleScrollStop}
            >

                {/* Horizontal Tabs */}
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
                            <Text className={`text-2xl font-bold ${activeTab === tab ? 'text-foreground' : 'text-muted'}`}>
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
                    {activeTab === 'Songs' && (
                        <View className="flex-row gap-4 mb-6">
                            <Button
                                className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                                onPress={() => console.log('Play All')}
                            >
                                <Ionicons name="play" size={20} color={theme.foreground} />
                                <Text className="text-lg font-bold text-foreground uppercase">Play</Text>
                            </Button>
                            <Button
                                className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                                onPress={() => console.log('Shuffle')}
                            >
                                <Ionicons name="shuffle" size={20} color={theme.foreground} />
                                <Text className="text-lg font-bold text-foreground uppercase">Shuffle</Text>
                            </Button>
                        </View>
                    )}
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-[20px] font-bold text-foreground">{currentData.length} {activeTab}</Text>
                        <Pressable className="flex-row items-center gap-1 active:opacity-50">
                            <Text className="text-[15px] font-medium text-muted">Recently Added</Text>
                            <Ionicons name="chevron-down" size={16} color={theme.muted} />
                        </Pressable>
                    </View>

                    {activeTab === 'Albums' ? (
                        <AlbumGrid data={libraryAlbums} />
                    ) : activeTab === 'Artists' ? (
                        <ArtistGrid data={libraryArtists} />
                    ) : activeTab === 'Playlists' ? (
                        <PlaylistList data={libraryPlaylists} />
                    ) : activeTab === 'Folders' ? (
                        <FolderList data={libraryFolders} />
                    ) : (
                        <SongList data={libraryMusic} />
                    )}
                </Animated.View>

                <View style={{ height: 160 }} />
            </ScrollView>
        </View>
    );
}
