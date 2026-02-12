import React, { useLayoutEffect } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "@nanostores/react";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { TrackRow } from "@/components/patterns";
import {
  ContentSection,
  MediaCarousel,
  RankedTrackCarousel,
} from "@/components/blocks";
import { $indexerState } from "@/modules/indexer";
import { playTrack, type Track } from "@/modules/player/player.store";
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/hooks/scroll-bars.store";
import { useHomeScreen } from "@/modules/library/hooks/use-home-screen";
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid";
import LocalClockSolidIcon from "@/components/icons/local/clock-solid";

const CHUNK_SIZE = 5;

export default function HomeScreen() {
  const router = useRouter();
  const theme = useThemeColors();
  const indexerState = useStore($indexerState);
  const { recentlyPlayedTracks, topTracks, refresh } = useHomeScreen();

  function renderRecentlyPlayedItem(item: Track) {
    return (
      <TrackRow
        track={item}
        variant="grid"
        onPress={() => playTrack(item, recentlyPlayedTracks)}
      />
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
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
      <View className="pt-6">
        <ContentSection
          title="Recently Played"
          data={recentlyPlayedTracks}
          onViewMore={() => router.push("/(main)/(home)/recently-played")}
          emptyState={{
            icon: (
              <LocalClockSolidIcon
                fill="none"
                width={48}
                height={48}
                color={theme.muted}
              />
            ),
            title: "No recently played",
            message: "Start playing music!",
          }}
          renderContent={(data) => (
            <MediaCarousel
              data={data}
              renderItem={renderRecentlyPlayedItem}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              gap={10}
            />
          )}
        />

        <ContentSection
          title="Top Tracks"
          data={topTracks}
          onViewMore={() => router.push("/(main)/(home)/top-tracks")}
          emptyState={{
            icon: (
              <LocalMusicNoteSolidIcon
                fill="none"
                width={48}
                height={48}
                color={theme.muted}
              />
            ),
            title: "No top tracks",
            message: "Play more music together!",
          }}
          renderContent={(data) => (
            <RankedTrackCarousel data={data} chunkSize={CHUNK_SIZE} />
          )}
        />
      </View>
    </ScrollView>
  );
}
