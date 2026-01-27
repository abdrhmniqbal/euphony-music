import { View, Text, FlatList, useColorScheme } from "react-native";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemAction } from "@/components/item";
import { playTrack } from "@/store/player-store";
import { Colors } from "@/constants/colors";
import { Button } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { handleScrollStart, handleScrollStop } from "@/store/ui-store";

export default function RecentlyPlayedScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? "light"];

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
    ];

    return (
        <View className="flex-1 bg-background">
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

            <FlatList
                data={recentMusic}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                    <Item
                        onPress={() => playTrack({ title: item.title, subtitle: item.artist })}
                    >
                        <ItemImage icon="musical-note" />
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
        </View>
    );
}
