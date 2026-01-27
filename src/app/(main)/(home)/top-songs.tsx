import { View, Text, FlatList, Pressable, useColorScheme } from "react-native";
import { useState } from "react";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemRank, ItemAction } from "@/components/item";
import { playTrack } from "@/store/player-store";
import { Colors } from "@/constants/colors";
import { Button } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { handleScrollStart, handleScrollStop } from "@/store/ui-store";

const TABS = ["Realtime", "Daily", "Weekly"] as const;
type TabType = typeof TABS[number];

import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";

export default function TopSongsScreen() {
    const [activeTab, setActiveTab] = useState<TabType>("Realtime");
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? "light"];

    const realtimeSongs = [
        { title: "Bling-Bang-Bang-Born", artist: "Creepy Nuts" },
        { title: "Gimo Kou Nen", artist: "Omoinotake" },
        { title: "Suironteki ni Uchuujin", artist: "Geni wa Jibun ni aru." },
        { title: "Bankanka", artist: "tuki." },
        { title: "Michiteyuku", artist: "Fujii Kaze" },
        { title: "Night Dancer", artist: "Imase" },
        { title: "Idol", artist: "YOASOBI" },
        { title: "Stay With Me", artist: "Miki Matsubara" },
        { title: "First Love", artist: "Hikaru Utada" },
        { title: "Dry Flower", artist: "Yuuri" },
    ];

    const dailySongs = [
        { title: "Idol", artist: "YOASOBI" },
        { title: "Specialz", artist: "King Gnu" },
        { title: "Odo", artist: "Ado" },
        { title: "Kick Back", artist: "Kenshi Yonezu" },
        { title: "Overdose", artist: "natori" },
        { title: "Ditto", artist: "NewJeans" },
        { title: "OMG", artist: "NewJeans" },
        { title: "Seven", artist: "Jung Kook" },
        { title: "Pink Venom", artist: "BLACKPINK" },
        { title: "After Like", artist: "IVE" },
    ];

    const weeklySongs = [
        { title: "Shinunoga E-Wa", artist: "Fujii Kaze" },
        { title: "Matsuri", artist: "Fujii Kaze" },
        { title: "Subtitle", artist: "Official HIGE DANdism" },
        { title: "Mixed Nuts", artist: "Official HIGE DANdism" },
        { title: "W/X/Y", artist: "Tani Yuuki" },
        { title: "Cinderella Boy", artist: "Saucy Dog" },
        { title: "Betelgeuse", artist: "Yuuri" },
        { title: "Leo", artist: "Yuuri" },
        { title: "Dried Flower", artist: "Yuuri" },
        { title: "Tracing A Dream", artist: "YOASOBI" },
    ];

    const currentSongs = activeTab === "Daily" ? dailySongs : activeTab === "Weekly" ? weeklySongs : realtimeSongs;

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row px-4 py-4 gap-6">
                {TABS.map((tab) => (
                    <Pressable key={tab} onPress={() => setActiveTab(tab)}>
                        <Text
                            className={`text-2xl font-bold ${activeTab === tab ? 'text-foreground' : 'text-muted'}`}
                        >
                            {tab}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <View className="flex-row px-4 py-4 gap-4">
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

            <Animated.View
                key={activeTab}
                entering={FadeInRight.duration(300)}
                exiting={FadeOutLeft.duration(300)}
                className="flex-1"
            >
                <FlatList
                    data={currentSongs}
                    keyExtractor={(_, index) => `${activeTab}-${index}`}
                    renderItem={({ item, index }) => (
                        <Item
                            onPress={() => playTrack({ title: item.title, subtitle: item.artist })}
                        >
                            <ItemImage icon="musical-note" />
                            <ItemRank>{index + 1}</ItemRank>
                            <ItemContent>
                                <ItemTitle>{item.title}</ItemTitle>
                                <ItemDescription>{item.artist}</ItemDescription>
                            </ItemContent>
                            <ItemAction>
                                <Ionicons name="ellipsis-horizontal" size={24} color={theme.muted} />
                            </ItemAction>
                        </Item>
                    )}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 160 }}
                    className="flex-1"
                    onScrollBeginDrag={handleScrollStart}
                    onMomentumScrollEnd={handleScrollStop}
                    onScrollEndDrag={handleScrollStop}
                />
            </Animated.View>
        </View>
    );
}
