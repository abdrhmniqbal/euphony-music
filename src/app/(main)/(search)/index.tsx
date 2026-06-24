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

import { Input, PressableFeedback, Button, Card } from "heroui-native"
import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { ContentSection } from "@/components/blocks/content-section"

import { MediaCarousel } from "@/components/blocks/media-carousel"
import LocalClockSolidIcon from "@/components/icons/local/clock-solid"
import LocalSearchIcon from "@/components/icons/local/search"
import LocalPlaylistSolidIcon from "@/components/icons/local/playlist-solid"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import { TrackActionSheet } from "@/components/blocks/track-action-sheet"
import { TrackRow } from "@/components/patterns/track-row"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { PlaylistArtwork } from "@/components/patterns/playlist-artwork"
import { useCurrentTrackId } from "@/modules/player/selectors"
import { playTrack } from "@/modules/player/service"
import { useTracks } from "@/modules/tracks/queries"
import { useDailyMix, useForYouMix } from "@/modules/mixes/queries"
import { setPlaylistFormDraft } from "@/modules/playlist/form-draft-store"
import { useThemeColors } from "@/modules/ui/theme"
import { handleScroll, handleScrollStart, handleScrollStop } from "@/modules/ui/store"
import { transformDBTrackToTrack } from "@/utils/transformers"
import { createTrackListQueueContext } from "@/stores/playback/types"

const RECENTLY_ADDED_LIMIT = 8

export default function SearchScreen() {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const router = useRouter()
  const currentTrackId = useCurrentTrackId()
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [isTrackSheetOpen, setIsTrackSheetOpen] = useState(false)
  const [showMixActionSheet, setShowMixActionSheet] = useState(false)
  const [activeMix, setActiveMix] = useState<{
    id: string
    title: string
    description: string
    images: string[]
    tracks: Track[]
  } | null>(null)

  const { data: dailyMix } = useDailyMix()
  const { data: forYouMix } = useForYouMix()

  const { data: dbTracks = [] } = useTracks({
    sortBy: "dateAdded",
    sortOrder: "desc",
  })

  const recentlyAddedTracks = useMemo(
    () => (dbTracks as DBTrack[]).map(transformDBTrackToTrack),
    [dbTracks]
  )
  const recentlyAddedPreviewTracks = recentlyAddedTracks.slice(0, RECENTLY_ADDED_LIMIT)

  const openTrackSheet = useCallback((track: Track) => {
    setSelectedTrack(track)
    setIsTrackSheetOpen(true)
  }, [])

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
      onLongPress={() => openTrackSheet(item)}
      titleClassName={currentTrackId === item.id ? "text-accent" : undefined}
      imageOverlay={currentTrackId === item.id ? <ScaleLoader size={16} /> : undefined}
    />
  )

  const handleSearchPress = () => {
    router.push("/(main)/(search)/search")
  }

  const handleMixLongPress = useCallback(
    (mixId: string) => {
      const isDaily = mixId === "daily"
      const mixTracks = isDaily ? dailyMixTracks : forYouMixTracks
      const mixImages = isDaily ? dailyMixImages : forYouMixImages
      const mixTitle = isDaily
        ? t("home.topTracks.dailyMix", "Daily Mix")
        : t("home.topTracks.forYouMix", "For You Mix")
      const mixDescription = isDaily
        ? t("home.topTracks.dailyMixDesc", "Fresh from your recent listening")
        : t("home.topTracks.forYouMixDesc", "Built from your longer-term taste")

      setActiveMix({
        id: mixId,
        title: mixTitle,
        description: mixDescription,
        images: mixImages,
        tracks: mixTracks,
      })
      setShowMixActionSheet(true)
    },
    [dailyMixTracks, dailyMixImages, forYouMixTracks, forYouMixImages, t]
  )

  const handleSaveMixToPlaylist = useCallback(() => {
    if (!activeMix) return
    setShowMixActionSheet(false)
    const trackIds = activeMix.tracks.map((t) => t.id)
    setPlaylistFormDraft(trackIds, null)
    router.push("/playlist/form")
  }, [activeMix, router])

  const dailyMixTracks = useMemo(() => dailyMix?.tracks ?? [], [dailyMix])
  const forYouMixTracks = useMemo(() => forYouMix?.tracks ?? [], [forYouMix])

  const dailyMixImages = useMemo(() => {
    return dailyMixTracks.map((t) => t.image).filter(Boolean) as string[]
  }, [dailyMixTracks])

  const forYouMixImages = useMemo(() => {
    return forYouMixTracks.map((t) => t.image).filter(Boolean) as string[]
  }, [forYouMixTracks])

  const dailyMixColor = useMemo(() => {
    if (!theme.rainbow || theme.rainbow.length === 0) return "#3b82f6"
    return theme.rainbow[(dailyMix?.colorIndex ?? 0) % theme.rainbow.length]
  }, [theme.rainbow, dailyMix])

  const forYouMixColor = useMemo(() => {
    if (!theme.rainbow || theme.rainbow.length === 0) return "#8b5cf6"
    return theme.rainbow[(forYouMix?.colorIndex ?? 0) % theme.rainbow.length]
  }, [theme.rainbow, forYouMix])

  const dailyMixPattern = dailyMix?.shape ?? "circles"
  const forYouMixPattern = forYouMix?.shape ?? "circles"

  return (
    <>
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

        <View className="mb-6 px-4 flex-row gap-3">
          <PressableFeedback
            onPress={() => router.push("/(main)/(search)/mix/daily" as any)}
            onLongPress={() => handleMixLongPress("daily")}
            className="flex-1 active:opacity-80"
          >
            <Card className="relative aspect-square overflow-hidden rounded-[28px] border-none p-0">
              <View className="absolute inset-0 bg-surface-secondary">
                <PlaylistArtwork images={dailyMixImages} />
              </View>

              <View
                className="absolute bottom-0 inset-x-0 overflow-hidden py-4 px-5 justify-center items-start"
                style={{ backgroundColor: dailyMixColor }}
              >
                <View pointerEvents="none" className="absolute inset-0">
                  {dailyMixPattern === "circles" && (
                    <>
                      <View className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
                      <View className="absolute right-4 bottom-[-10] h-16 w-16 rounded-full bg-white/8" />
                    </>
                  )}
                  {dailyMixPattern === "waves" && (
                    <>
                      <View className="absolute bottom-[-20] -left-12 h-40 w-40 rounded-full border-20 border-white/10" />
                      <View className="absolute top-[-20] right-[-20] h-28 w-28 rounded-full border-12 border-white/10" />
                    </>
                  )}
                  {dailyMixPattern === "grid" && (
                    <View className="absolute inset-0 flex-row flex-wrap gap-2 p-1.5">
                      {Array.from({ length: 12 }).map((_, index) => (
                        <View
                          key={`daily-grid-${index}`}
                          className="h-6 w-6 rounded-sm bg-white/5"
                        />
                      ))}
                    </View>
                  )}
                  {dailyMixPattern === "diamonds" && (
                    <>
                      <View className="absolute top-4 right-[-10] h-16 w-16 rotate-45 bg-white/10" />
                      <View className="absolute bottom-0 left-[-20] h-24 w-24 rotate-45 bg-white/5" />
                    </>
                  )}
                  {dailyMixPattern === "triangles" && (
                    <>
                      <View className="absolute top-0 right-0 h-0 w-0 border-t-40 border-l-40 border-t-white/10 border-l-transparent" />
                      <View className="absolute bottom-[-10] left-4 h-0 w-0 border-r-60 border-b-60 border-r-transparent border-b-white/8" />
                    </>
                  )}
                  {dailyMixPattern === "rings" && (
                    <>
                      <View className="absolute -top-2 -right-2 h-16 w-16 rounded-full border-4 border-white/15" />
                      <View className="absolute -top-6 -right-6 h-24 w-24 rounded-full border-4 border-white/8" />
                    </>
                  )}
                  {dailyMixPattern === "pills" && (
                    <>
                      <View className="absolute top-2 right-0 h-8 w-20 rotate-[-15deg] rounded-full bg-white/10" />
                      <View className="absolute bottom-4 -left-4 h-10 w-24 rotate-25 rounded-full bg-white/8" />
                    </>
                  )}
                  {dailyMixPattern === "stripes" && (
                    <>
                      <View className="absolute top-0 -left-6 h-28 w-3 rotate-12 bg-white/8" />
                      <View className="absolute top-0 left-6 h-28 w-3 rotate-12 bg-white/10" />
                      <View className="absolute top-0 left-18 h-28 w-3 rotate-12 bg-white/8" />
                      <View className="absolute top-0 left-30 h-28 w-3 rotate-12 bg-white/10" />
                    </>
                  )}
                  {dailyMixPattern === "stars" && (
                    <>
                      <View className="absolute top-4 right-6 h-12 w-3 rounded-full bg-white/10" />
                      <View className="absolute top-8 right-1.5 h-3 w-12 rounded-full bg-white/10" />
                      <View className="absolute bottom-3 left-7 h-8 w-2 rounded-full bg-white/8" />
                      <View className="absolute bottom-6 left-4 h-2 w-8 rounded-full bg-white/8" />
                    </>
                  )}
                  {dailyMixPattern === "zigzag" && (
                    <>
                      <View className="absolute top-6 right-[-8] h-2 w-14 rotate-45 bg-white/10" />
                      <View className="absolute top-12 right-2 h-2 w-14 -rotate-45 bg-white/8" />
                      <View className="absolute top-18 right-[-8] h-2 w-14 rotate-45 bg-white/8" />
                      <View className="absolute bottom-6 left-[-8] h-2 w-12 -rotate-45 bg-white/8" />
                    </>
                  )}
                  {dailyMixPattern === "crosses" && (
                    <>
                      <View className="absolute top-4 right-5 h-10 w-2 rounded-full bg-white/10" />
                      <View className="absolute top-8 right-1 h-2 w-10 rounded-full bg-white/10" />
                      <View className="absolute bottom-4 left-5 h-8 w-2 rounded-full bg-white/8" />
                      <View className="absolute bottom-7 left-2 h-2 w-8 rounded-full bg-white/8" />
                    </>
                  )}
                </View>
                <Text className="text-[17px] leading-tight font-black text-white" numberOfLines={1}>
                  {t("home.topTracks.dailyMix", "Daily Mix")}
                </Text>
              </View>
            </Card>
          </PressableFeedback>

          <PressableFeedback
            onPress={() => router.push("/(main)/(search)/mix/foryou" as any)}
            onLongPress={() => handleMixLongPress("foryou")}
            className="flex-1 active:opacity-80"
          >
            <Card className="relative aspect-square overflow-hidden rounded-[28px] border-none p-0">
              <View className="absolute inset-0 bg-surface-secondary">
                <PlaylistArtwork images={forYouMixImages} />
              </View>

              <View
                className="absolute bottom-0 inset-x-0 overflow-hidden py-4 px-5 justify-center items-start"
                style={{ backgroundColor: forYouMixColor }}
              >
                <View pointerEvents="none" className="absolute inset-0">
                  {forYouMixPattern === "circles" && (
                    <>
                      <View className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
                      <View className="absolute right-4 bottom-[-10] h-16 w-16 rounded-full bg-white/8" />
                    </>
                  )}
                  {forYouMixPattern === "waves" && (
                    <>
                      <View className="absolute bottom-[-20] -left-12 h-40 w-40 rounded-full border-20 border-white/10" />
                      <View className="absolute top-[-20] right-[-20] h-28 w-28 rounded-full border-12 border-white/10" />
                    </>
                  )}
                  {forYouMixPattern === "grid" && (
                    <View className="absolute inset-0 flex-row flex-wrap gap-2 p-1.5">
                      {Array.from({ length: 12 }).map((_, index) => (
                        <View
                          key={`foryou-grid-${index}`}
                          className="h-6 w-6 rounded-sm bg-white/5"
                        />
                      ))}
                    </View>
                  )}
                  {forYouMixPattern === "diamonds" && (
                    <>
                      <View className="absolute top-4 right-[-10] h-16 w-16 rotate-45 bg-white/10" />
                      <View className="absolute bottom-0 left-[-20] h-24 w-24 rotate-45 bg-white/5" />
                    </>
                  )}
                  {forYouMixPattern === "triangles" && (
                    <>
                      <View className="absolute top-0 right-0 h-0 w-0 border-t-40 border-l-40 border-t-white/10 border-l-transparent" />
                      <View className="absolute bottom-[-10] left-4 h-0 w-0 border-r-60 border-b-60 border-r-transparent border-b-white/8" />
                    </>
                  )}
                  {forYouMixPattern === "rings" && (
                    <>
                      <View className="absolute -top-2 -right-2 h-16 w-16 rounded-full border-4 border-white/15" />
                      <View className="absolute -top-6 -right-6 h-24 w-24 rounded-full border-4 border-white/8" />
                    </>
                  )}
                  {forYouMixPattern === "pills" && (
                    <>
                      <View className="absolute top-2 right-0 h-8 w-20 rotate-[-15deg] rounded-full bg-white/10" />
                      <View className="absolute bottom-4 -left-4 h-10 w-24 rotate-25 rounded-full bg-white/8" />
                    </>
                  )}
                  {forYouMixPattern === "stripes" && (
                    <>
                      <View className="absolute top-0 -left-6 h-28 w-3 rotate-12 bg-white/8" />
                      <View className="absolute top-0 left-6 h-28 w-3 rotate-12 bg-white/10" />
                      <View className="absolute top-0 left-18 h-28 w-3 rotate-12 bg-white/8" />
                      <View className="absolute top-0 left-30 h-28 w-3 rotate-12 bg-white/10" />
                    </>
                  )}
                  {forYouMixPattern === "stars" && (
                    <>
                      <View className="absolute top-4 right-6 h-12 w-3 rounded-full bg-white/10" />
                      <View className="absolute top-8 right-1.5 h-3 w-12 rounded-full bg-white/10" />
                      <View className="absolute bottom-3 left-7 h-8 w-2 rounded-full bg-white/8" />
                      <View className="absolute bottom-6 left-4 h-2 w-8 rounded-full bg-white/8" />
                    </>
                  )}
                  {forYouMixPattern === "zigzag" && (
                    <>
                      <View className="absolute top-6 right-[-8] h-2 w-14 rotate-45 bg-white/10" />
                      <View className="absolute top-12 right-2 h-2 w-14 -rotate-45 bg-white/8" />
                      <View className="absolute top-18 right-[-8] h-2 w-14 rotate-45 bg-white/8" />
                      <View className="absolute bottom-6 left-[-8] h-2 w-12 -rotate-45 bg-white/8" />
                    </>
                  )}
                  {forYouMixPattern === "crosses" && (
                    <>
                      <View className="absolute top-4 right-5 h-10 w-2 rounded-full bg-white/10" />
                      <View className="absolute top-8 right-1 h-2 w-10 rounded-full bg-white/10" />
                      <View className="absolute bottom-4 left-5 h-8 w-2 rounded-full bg-white/8" />
                      <View className="absolute bottom-7 left-2 h-2 w-8 rounded-full bg-white/8" />
                    </>
                  )}
                </View>
                <Text className="text-[17px] leading-tight font-black text-white" numberOfLines={1}>
                  {t("home.topTracks.forYouMix", "For You Mix")}
                </Text>
              </View>
            </Card>
          </PressableFeedback>
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
      <TrackActionSheet
        track={selectedTrack}
        isOpen={isTrackSheetOpen}
        onClose={() => setIsTrackSheetOpen(false)}
        tracks={recentlyAddedTracks}
        queueContext={createTrackListQueueContext(t("search.recentlyAdded"))}
      />
      {activeMix && (
        <CollectionActionSheet
          visible={showMixActionSheet}
          onOpenChange={setShowMixActionSheet}
          type="mix"
          id={activeMix.id}
          name={activeMix.title}
          subtitle={activeMix.description}
          images={activeMix.images}
          trackCount={activeMix.tracks.length}
          hideFavoriteAction
        >
          <Button
            variant="ghost"
            onPress={handleSaveMixToPlaylist}
            className="h-13 w-full justify-start px-0"
          >
            <View className="flex-row items-center gap-4 px-1">
              <View className="w-6 items-center justify-center">
                <LocalPlaylistSolidIcon
                  fill="none"
                  width={24}
                  height={24}
                  color={theme.foreground}
                />
              </View>
              <Text className="text-base font-medium text-foreground">
                {t("track.addToPlaylist")}
              </Text>
            </View>
          </Button>
        </CollectionActionSheet>
      )}
    </>
  )
}
