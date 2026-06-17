/**
 * Purpose: Renders the search landing screen with quick access to recent additions using full-context playback queues.
 * Caller: Expo Router search tab.
 * Dependencies: Tracks query, react-i18next, player playback helpers, search/library navigation, theme colors, scroll state helpers.
 * Main Functions: SearchScreen()
 * Side Effects: Updates scroll state, starts playback from full recent-addition queues, and navigates to search/library detail routes.
 */

import type { Track } from "@/modules/player/store"
import type { DBTrack } from "@/types/database"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"

import { Input, PressableFeedback } from "heroui-native"
import { useMemo } from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"
import { ContentSection } from "@/components/blocks/content-section"
import { MediaCarousel } from "@/components/blocks/media-carousel"
import LocalClockSolidIcon from "@/components/icons/local/clock-solid"
import LocalSearchIcon from "@/components/icons/local/search"
import { TrackRow } from "@/components/patterns/track-row"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { useCurrentTrackId } from "@/modules/player/selectors"
import { playTrack } from "@/modules/player/service"
import { useTracks } from "@/modules/tracks/queries"
import { useThemeColors } from "@/modules/ui/theme"
import { handleScroll, handleScrollStart, handleScrollStop } from "@/modules/ui/store"
import { transformDBTrackToTrack } from "@/utils/transformers"

const RECENTLY_ADDED_LIMIT = 8

export default function SearchScreen() {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const router = useRouter()
  const currentTrackId = useCurrentTrackId()
  const { data: dbTracks = [] } = useTracks({
    sortBy: "dateAdded",
    sortOrder: "desc",
  })

  const recentlyAddedTracks = useMemo(
    () => (dbTracks as DBTrack[]).map(transformDBTrackToTrack),
    [dbTracks]
  )
  const recentlyAddedPreviewTracks = recentlyAddedTracks.slice(0, RECENTLY_ADDED_LIMIT)

  const renderRecentlyAddedItem = (item: Track) => (
    <TrackRow
      track={item}
      variant="grid"
      onPress={() =>
        playTrack(item, recentlyAddedTracks, {
          type: "trackList",
          title: t("search.recentlyAdded"),
        })
      }
      titleClassName={currentTrackId === item.id ? "text-accent" : undefined}
      imageOverlay={currentTrackId === item.id ? <ScaleLoader size={16} /> : undefined}
    />
  )

  const handleSearchPress = () => {
    router.push("/(main)/(search)/search")
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 220 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
      onScrollBeginDrag={handleScrollStart}
      onMomentumScrollEnd={handleScrollStop}
      onScrollEndDrag={handleScrollStop}
      scrollEventThrottle={16}
    >
      <View className="relative my-6 px-3">
        <View className="absolute top-1/2 left-7 z-10 -translate-y-1/2">
          <LocalSearchIcon fill="none" width={24} height={24} color={theme.muted} />
        </View>
        <Input
          value=""
          editable={false}
          showSoftInputOnFocus={false}
          placeholder={t("search.landingPlaceholder")}
          className="pl-12"
        />
        <PressableFeedback
          onPress={handleSearchPress}
          className="absolute inset-0 z-20"
          accessibilityRole="button"
          accessibilityLabel={t("search.openSearch")}
        />
      </View>

      <ContentSection
        title={t("search.recentlyAdded")}
        data={recentlyAddedPreviewTracks}
        onViewMore={() => router.push("/(main)/(search)/recently-added")}
        emptyState={{
          icon: <LocalClockSolidIcon fill="none" width={48} height={48} color={theme.muted} />,
          title: t("search.empty.recentlyAddedTitle"),
          message: t("search.empty.recentlyAddedMessage"),
        }}
        renderContent={(data) => (
          <MediaCarousel
            data={data}
            renderItem={renderRecentlyAddedItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            gap={10}
            dataVersionKey={currentTrackId ?? undefined}
          />
        )}
      />
    </ScrollView>
  )
}
