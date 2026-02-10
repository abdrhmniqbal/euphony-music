import { View, Text, ScrollView, RefreshControl } from "react-native";
import { EmptyState } from "@/components/ui";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { handleScroll, handleScrollStart, handleScrollStop } from "@/hooks/scroll-bars.store";
import { useStore } from "@nanostores/react";
import { $indexerState } from "@/modules/indexer";
import { TrackList } from "@/components/blocks/track-list";
import { useRecentlyPlayedScreen } from "@/modules/history/hooks/use-recently-played-screen";
import { PlaybackActionsRow } from "@/components/blocks";

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
                    <PlaybackActionsRow onPlay={playFirst} onShuffle={shuffle} className="px-4 py-4" />
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
                        <TrackList data={history} />
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
