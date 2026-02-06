import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { EmptyState } from "@/components/empty-state";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Button } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/shared/hooks/scroll-bars.store";
import { useStore } from "@nanostores/react";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { $indexerState } from "@/features/indexer";
import { SongList } from "@/components/library/song-list";
import { TOP_SONGS_TABS, useTopSongsScreen } from "@/features/home/use-top-songs-screen";

export default function TopSongsScreen() {
    const indexerState = useStore($indexerState);
    const theme = useThemeColors();
    const { activeTab, setActiveTab, currentSongs, refresh, playAll, shuffle } = useTopSongsScreen();

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row px-4 py-4 gap-6">
                {TOP_SONGS_TABS.map((tab) => (
                    <Pressable key={tab} onPress={() => setActiveTab(tab)}>
                        <Text
                            className={`text-xl font-bold ${activeTab === tab ? 'text-foreground' : 'text-muted'}`}
                        >
                            {tab}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 200 }}
                onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
                onScrollBeginDrag={handleScrollStart}
                onMomentumScrollEnd={handleScrollStop}
                onScrollEndDrag={handleScrollStop}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl refreshing={indexerState.isIndexing} onRefresh={refresh} tintColor={theme.accent} />
                }
            >
                {currentSongs.length > 0 && (
                    <View className="flex-row px-4 py-4 gap-4">
                        <Button
                            className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                            onPress={playAll}
                        >
                            <Ionicons name="play" size={20} color={theme.foreground} />
                            <Text className="text-lg font-bold text-foreground uppercase">Play</Text>
                        </Button>
                        <Button
                            className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                            onPress={shuffle}
                        >
                            <Ionicons name="shuffle" size={20} color={theme.foreground} />
                            <Text className="text-lg font-bold text-foreground uppercase">Shuffle</Text>
                        </Button>
                    </View>
                )}

                <Animated.View
                    key={activeTab}
                    entering={FadeInRight.duration(300)}
                    exiting={FadeOutLeft.duration(300)}
                    className="px-4"
                >
                    {currentSongs.length === 0 ? (
                        <EmptyState
                            icon="musical-notes-outline"
                            title="No top songs yet"
                            message="Play some music to see your most played tracks here!"
                            className="mt-12"
                        />
                    ) : (
                        <SongList data={currentSongs} showNumbers />
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}
