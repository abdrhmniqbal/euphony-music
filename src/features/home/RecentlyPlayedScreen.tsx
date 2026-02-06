import { View, Text, ScrollView, RefreshControl } from "react-native";
import { EmptyState } from "@/components/empty-state";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Button } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/shared/hooks/scroll-bars.store";
import { useStore } from "@nanostores/react";
import { $indexerState } from "@/features/indexer";
import { SongList } from "@/components/library/song-list";
import { useRecentlyPlayedScreen } from "@/features/home/use-recently-played-screen";

export default function RecentlyPlayedScreen() {
    const theme = useThemeColors();
    const indexerState = useStore($indexerState);
    const { history, refresh, playFirst, shuffle } = useRecentlyPlayedScreen();

    return (
        <View className="flex-1 bg-background">
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
                {history.length > 0 && (
                    <View className="flex-row px-4 py-4 gap-4">
                        <Button
                            className="flex-1 h-14 rounded-xl bg-default flex-row items-center justify-center gap-2"
                            onPress={playFirst}
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

                <View className="px-4">
                    {history.length === 0 ? (
                        <EmptyState
                            icon="time-outline"
                            title="No recently played"
                            message="Your listening history will appear here once you start playing music."
                            className="mt-12"
                        />
                    ) : (
                        <SongList data={history} />
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
