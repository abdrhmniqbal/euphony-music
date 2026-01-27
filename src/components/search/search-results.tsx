import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemAction } from "@/components/item";
import { playTrack } from "@/store/player-store";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";

const SEARCH_TABS = ["All", "Song", "Album", "Artist", "Playlist", "Profile"];

export const SearchResults = () => {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];
    const [activeTab, setActiveTab] = useState("All");

    const artistResult = {
        name: "YOASOBI",
        type: "Artist",
        stats: "1,071,644",
        isVerified: true
    };

    const albumResults = [
        { title: "YOASOBI Greatest Hits", subtitle: "by LINE MUSIC", isVerified: true },
        { title: "Monthly Ranking", subtitle: "by LINE MUSIC", isVerified: true },
        { title: "Idol", subtitle: "YOASOBI", isVerified: false },
        { title: "The Book 3", subtitle: "YOASOBI", isVerified: false },
    ];

    const songResults = [
        { id: '1', title: "Idol", artist: "YOASOBI" },
        { id: '2', title: "Yuusha", artist: "YOASOBI" },
        { id: '3', title: "Yoru ni Kakeru", artist: "YOASOBI" },
        { id: '4', title: "Gunjou", artist: "YOASOBI" },
        { id: '5', title: "Kaibutsu", artist: "YOASOBI" },
    ];

    return (
        <View>
            {/* Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                className="py-4"
            >
                {SEARCH_TABS.map((tab) => (
                    <Pressable
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        className={`px-4 py-1.5 rounded-full ${activeTab === tab ? 'bg-accent' : 'bg-transparent'
                            }`}
                    >
                        <Text className={`font-medium ${activeTab === tab ? 'text-white' : 'text-muted'
                            }`}>
                            {tab}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            <View className="px-4 gap-8">
                {/* Artist Section */}
                {(activeTab === 'All' || activeTab === 'Artist') && (
                    <View>
                        <Item
                            variant="list"
                            className="py-1"
                            onPress={() => { }}
                        >
                            <ItemImage
                                icon="person"
                                className="rounded-full w-14 h-14 bg-default"
                            />
                            <ItemContent>
                                <ItemTitle className="text-lg">{artistResult.name}</ItemTitle>
                                <View className="flex-row items-center gap-1">
                                    <Text className="text-xs text-muted">{artistResult.type}</Text>
                                    <Text className="text-xs text-muted">♥ {artistResult.stats}</Text>
                                </View>
                            </ItemContent>
                        </Item>
                    </View>
                )}

                {/* Albums/Playlists Horizontal List */}
                {(activeTab === 'All' || activeTab === 'Album' || activeTab === 'Playlist') && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
                        <View className="flex-row gap-4">
                            {albumResults.map((album, index) => (
                                <Item
                                    key={index}
                                    variant="grid"
                                    className="w-32"
                                    onPress={() => { }}
                                >
                                    <ItemImage icon="musical-note" className="rounded-md" />
                                    <ItemContent className="mt-1">
                                        <ItemTitle className="text-sm normal-case" numberOfLines={2}>
                                            {album.title}
                                        </ItemTitle>
                                        <View className="flex-row items-center gap-1">
                                            <Text className="text-xs text-muted" numberOfLines={1}>
                                                {album.subtitle}
                                            </Text>
                                            {album.isVerified && (
                                                <Ionicons name="checkmark-circle" size={12} color={theme.accent} />
                                            )}
                                        </View>
                                    </ItemContent>
                                </Item>
                            ))}
                        </View>
                    </ScrollView>
                )}

                {/* Songs List */}
                {(activeTab === 'All' || activeTab === 'Song') && (
                    <View>
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-lg font-bold text-foreground">Songs</Text>
                            <Pressable>
                                <Text className="text-xs text-muted">See more</Text>
                            </Pressable>
                        </View>
                        <View className="gap-2">
                            {songResults.map((song) => (
                                <Item
                                    key={song.id}
                                    onPress={() => playTrack({ title: song.title, subtitle: song.artist })}
                                >
                                    <ItemImage icon="musical-note" className="rounded-md" />
                                    <ItemContent>
                                        <ItemTitle>{song.title}</ItemTitle>
                                        <ItemDescription>{song.artist}</ItemDescription>
                                    </ItemContent>
                                    <ItemAction>
                                        <Ionicons name="ellipsis-horizontal" size={20} color={theme.muted} />
                                    </ItemAction>
                                </Item>
                            ))}
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};
