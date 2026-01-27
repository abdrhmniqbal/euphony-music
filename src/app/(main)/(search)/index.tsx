import React, { useState, useLayoutEffect } from "react";
import { Text, View, ScrollView, Pressable, TextInput } from "react-native";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import { Card } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import { getRandomRainbowColor } from "@/utils/colors";

import { playTrack } from "@/store/player-store";
import { handleScrollStart, handleScrollStop } from "@/store/ui-store";


// RecentSearchItem removed in favor of MusicCard

const CategoryCard = ({ title, color, pattern }: { title: string, color: string, pattern?: 'circles' | 'waves' | 'grid' | 'diamonds' | 'triangles' | 'rings' | 'pills' }) => {
    return (
        <Card className={`w-[47.5%] h-24 p-4 justify-start overflow-hidden border-none ${color} relative`}>
            <Text className="text-white font-bold text-[17px] z-10 leading-tight">{title}</Text>
            {/* Subtle Geometric Patterns */}
            <View className="absolute inset-0 opacity-30">
                {pattern === 'circles' && (
                    <>
                        <View className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/30" />
                        <View className="absolute left-1/2 top-1/2 w-12 h-12 rounded-full bg-white/10 -translate-x-6 -translate-y-6" />
                        <View className="absolute right-4 bottom-[-10] w-16 h-16 rounded-full bg-white/20" />
                    </>
                )}
                {pattern === 'waves' && (
                    <>
                        <View className="absolute -left-12 bottom-[-20] w-40 h-40 rounded-full border-20 border-white/20" />
                        <View className="absolute right-[-20] top-[-20] w-28 h-28 rounded-full border-12 border-white/20" />
                    </>
                )}
                {pattern === 'grid' && (
                    <View className="absolute inset-0 flex-row flex-wrap gap-2 p-1.5">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <View key={i} className="w-6 h-6 rounded-sm bg-white/10" />
                        ))}
                    </View>
                )}
                {pattern === 'diamonds' && (
                    <>
                        <View className="absolute right-[-10] top-4 w-16 h-16 bg-white/30 rotate-45" />
                        <View className="absolute left-[-20] bottom-0 w-24 h-24 bg-white/10 rotate-45" />
                        <View className="absolute right-10 bottom-[-15] w-12 h-12 bg-white/20 rotate-45" />
                    </>
                )}
                {pattern === 'triangles' && (
                    <>
                        <View className="absolute right-0 top-0 w-0 h-0 border-l-40 border-l-transparent border-t-40 border-t-white/30" />
                        <View className="absolute left-4 bottom-[-10] w-0 h-0 border-r-60 border-r-transparent border-b-60 border-b-white/15" />
                        <View className="absolute right-12 top-1/2 w-0 h-0 border-l-25 border-l-transparent border-b-25 border-b-white/20" />
                    </>
                )}
                {pattern === 'rings' && (
                    <>
                        <View className="absolute -right-2 -top-2 w-16 h-16 rounded-full border-4 border-white/40" />
                        <View className="absolute -right-6 -top-6 w-24 h-24 rounded-full border-4 border-white/20" />
                        <View className="absolute -left-4 bottom-2 w-12 h-12 rounded-full border-4 border-white/30" />
                    </>
                )}
                {pattern === 'pills' && (
                    <>
                        <View className="absolute right-0 top-2 w-20 h-8 rounded-full bg-white/30 rotate-[-15deg]" />
                        <View className="absolute -left-4 bottom-4 w-24 h-10 rounded-full bg-white/15 rotate-25" />
                        <View className="absolute right-8 bottom-[-10] w-16 h-6 rounded-full bg-white/20 rotate-10" />
                    </>
                )}
                {!pattern && (
                    <View className="absolute right-[-10] top-[-10] opacity-30 transform rotate-12">
                        <Ionicons name="sparkles-outline" size={60} color="white" />
                    </View>
                )}
            </View>
        </Card>
    );
};

export default function SearchScreen() {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];
    const navigation = useNavigation();
    const router = useRouter();
    const { focus } = useLocalSearchParams<{ focus?: string }>();
    const [searchQuery, setSearchQuery] = useState("");

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Pressable
                    onPress={() => router.push("/settings")}
                    className="mr-1 active:opacity-50"
                >
                    <Ionicons name="settings-outline" size={24} color={theme.foreground} />
                </Pressable>
            ),
        });
    }, [navigation, theme]);

    const genres = [
        { title: "J-Pop", color: getRandomRainbowColor(["bg-rainbow-yellow"]), pattern: "circles" },
        { title: "Western", color: getRandomRainbowColor(["bg-rainbow-yellow"]), pattern: "waves" },
        { title: "J-Rock", color: getRandomRainbowColor(["bg-rainbow-yellow"]), pattern: "diamonds" },
        { title: "J-Hip Hop", color: getRandomRainbowColor(["bg-rainbow-yellow"]), pattern: "triangles" },
        { title: "Anime", color: getRandomRainbowColor(["bg-rainbow-yellow"]), pattern: "rings" },
        { title: "Electronic", color: getRandomRainbowColor(["bg-rainbow-yellow"]), pattern: "grid" },
        { title: "Classical", color: getRandomRainbowColor(["bg-rainbow-yellow"]), pattern: "pills" },
        { title: "Jazz", color: getRandomRainbowColor(["bg-rainbow-yellow"]), pattern: "circles" },
    ];

    const moods = [
        { title: "Chill & Relax", color: getRandomRainbowColor(["bg-rainbow-yellow"]), pattern: "waves" },
        { title: "Focus", color: getRandomRainbowColor(["bg-rainbow-yellow"]), pattern: "grid" },
        { title: "Sad / Melancholy", color: getRandomRainbowColor(["bg-rainbow-yellow"]), pattern: "circles" },
        { title: "Morning Energy", color: getRandomRainbowColor(["bg-rainbow-yellow"]), pattern: "triangles" },
        { title: "Party Time", color: getRandomRainbowColor(["bg-rainbow-yellow"]), pattern: "diamonds" },
        { title: "Late Night", color: getRandomRainbowColor(["bg-rainbow-yellow"]), pattern: "rings" },
    ];

    const recentSearches = [
        { title: "YOASOBI Introductory Guide", subtitle: "Playlist · by LINE MUSIC" },
        { title: "IDOL", subtitle: "Song · YOASOBI" },
        { title: "THE BOOK", subtitle: "Album · YOASOBI" },
        { title: "Gunjou", subtitle: "Album · YOASOBI" },
    ];

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerStyle={{ padding: 20, paddingBottom: 160 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
            onScrollBeginDrag={handleScrollStart}
            onMomentumScrollEnd={handleScrollStop}
            onScrollEndDrag={handleScrollStop}
        >
            <Pressable
                onPress={() => router.push("/search-interaction")}
                className="mb-8 p-1 bg-default/50 rounded-2xl flex-row items-center px-4 h-14 border border-default active:opacity-70"
            >
                <Ionicons name="search-outline" size={20} color={theme.muted} />
                <Text className="ml-3 text-[17px] text-muted font-medium">Artists, songs, lyrics...</Text>
            </Pressable>

            <View className="mb-10">
                <Text className="text-[20px] font-bold text-foreground mb-4">Genres</Text>
                <View className="flex-row flex-wrap gap-x-[5%] gap-y-4">
                    {genres.map((genre) => (
                        <CategoryCard
                            key={genre.title}
                            title={genre.title}
                            color={genre.color}
                            pattern={genre.pattern as any}
                        />
                    ))}
                </View>
            </View>

            <View>
                <Text className="text-[20px] font-bold text-foreground mb-4">Moods</Text>
                <View className="flex-row flex-wrap gap-x-[5%] gap-y-4">
                    {moods.map((mood) => (
                        <CategoryCard
                            key={mood.title}
                            title={mood.title}
                            color={mood.color}
                            pattern={mood.pattern as any}
                        />
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}
