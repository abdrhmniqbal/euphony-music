import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemRank } from "@/components/item";
import { playTrack } from "@/store/player-store";
import { SectionTitle } from "@/components/section-title";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import React, { useState, useLayoutEffect } from "react";
import { useNavigation, useRouter } from "expo-router";
import { Pressable, Text, View, ScrollView, FlatList, LayoutAnimation } from "react-native";
import { handleScrollStart, handleScrollStop } from "@/store/ui-store";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
    const router = useRouter();
    const navigation = useNavigation();
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
                    <Pressable onPress={() => router.push("/settings")} className="active:opacity-50">
                        <Ionicons name="settings-outline" size={24} color={theme.foreground} />
                    </Pressable>
                </View>
            ),
        });
    }, [navigation, theme]);

    const recentMusic = [
        { title: "Blinding Lights", artist: "The Weeknd" },
        { title: "Levitating", artist: "Dua Lipa" },
        { title: "Save Your Tears", artist: "The Weeknd" },
        { title: "Peaches", artist: "Justin Bieber" },
        { title: "Good 4 U", artist: "Olivia Rodrigo" },
        { title: "Midnight City", artist: "M83" },
        { title: "Starboy", artist: "The Weeknd" },
        { title: "Instant Destiny", artist: "Tame Impala" },
        { title: "After Hours", artist: "The Weeknd" },
        { title: "Stay", artist: "The Kid LAROI" },
        { title: "Drivers License", artist: "Olivia Rodrigo" },
        { title: "Kiss Me More", artist: "Doja Cat" },
        { title: "Heat Waves", artist: "Glass Animals" },
        { title: "Bad Habits", artist: "Ed Sheeran" },
        { title: "Montero", artist: "Lil Nas X" },
    ];

    // Helper to chunk the list for the horizontal columns layout
    const chunkArray = (arr: any[], size: number) => {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    };

    const filteredSongs = recentMusic.filter(song =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const topSongsChunks = chunkArray(filteredSongs.slice(0, 25), 5);

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerStyle={{ paddingBottom: 160 }}
            contentInsetAdjustmentBehavior="automatic"
            onScrollBeginDrag={handleScrollStart}
            onMomentumScrollEnd={handleScrollStop}
            onScrollEndDrag={handleScrollStop}
        >
            <View className="pt-6">
                <SectionTitle
                    title="Recently Played"
                    className="px-4"
                    onViewMore={() => router.push("/(main)/(home)/recently-played")}
                />

                <FlatList
                    data={recentMusic.slice(0, 8)}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item }) => (
                        <Item
                            variant="grid"
                            onPress={() => playTrack({ title: item.title, subtitle: item.artist })}
                        >
                            <ItemImage icon="musical-note" />
                            <ItemContent>
                                <ItemTitle>{item.title}</ItemTitle>
                                <ItemDescription>{item.artist}</ItemDescription>
                            </ItemContent>
                        </Item>
                    )}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
                    className="mb-8"
                />

                <SectionTitle
                    title="Top Songs"
                    className="px-4"
                    onViewMore={() => router.push("/(main)/(home)/top-songs")}
                />

                <FlatList
                    data={topSongsChunks}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, index) => index.toString()}
                    pagingEnabled={false}
                    renderItem={({ item: chunk, index: chunkIndex }) => (
                        <View key={chunkIndex} className="w-[300px]">
                            {chunk.map((music, index) => (
                                <Item
                                    key={index}
                                    onPress={() => playTrack({ title: music.title, subtitle: music.artist })}
                                >
                                    <ItemImage icon="musical-note" />
                                    <ItemRank>{chunkIndex * 5 + index + 1}</ItemRank>
                                    <ItemContent>
                                        <ItemTitle>{music.title}</ItemTitle>
                                        <ItemDescription>{music.artist}</ItemDescription>
                                    </ItemContent>
                                </Item>
                            ))}
                        </View>
                    )}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 24 }}
                    className="mb-8"
                />
            </View>
        </ScrollView>
    );
}
