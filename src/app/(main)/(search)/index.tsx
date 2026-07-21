/**
 * Purpose: Renders the search landing screen with quick access to recent additions using full-context playback queues.
 * Caller: Expo Router search tab.
 * Dependencies: Tracks query, react-i18next, player playback helpers, search/library navigation, theme colors, scroll state helpers.
 * Main Functions: SearchScreen()
 * Side Effects: Updates scroll state, starts playback from full recent-addition queues, and navigates to search/library detail routes.
 */

import type { Track } from "@/modules/player/store"
import type { DBTrack } from "@/types/database"
import { useGuardedRouter as useRouter } from "@/modules/navigation"

import { Input, PressableFeedback } from "heroui-native"
import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"
import { ContentSection } from "@/modules/library/ui/content-section"

import { MediaCarousel } from "@/modules/library/ui/media-carousel"
import LocalClock01SolidIcon from "@/modules/shared/components/icons/local/clock-01-solid"
import LocalSearch01Icon from "@/modules/shared/components/icons/local/search-01"
import { MenuRow } from "@/modules/shared/components/ui/menu-row"
import { CollectionActionSheet } from "@/modules/library/ui/collection-action-sheet"
import { TrackActionSheet } from "@/modules/tracks/ui/track-action-sheet"
import { TrackRow } from "@/modules/tracks/ui/track-row"
import { ScaleLoader } from "@/modules/shared/components/ui/scale-loader"
import { MixCard } from "@/modules/mixes/ui/mix-card"
import { useCurrentTrackId } from "@/modules/player/selectors"
import { playTrack } from "@/modules/player/service"
import { useTracks } from "@/modules/tracks/queries"
import { useDailyMix, useForYouMix } from "@/modules/mixes/queries"
import { setPlaylistFormDraft } from "@/modules/playlist/form-draft-store"
import { useThemeColors } from "@/modules/ui/theme"
import { useAutoHideHeaderScroll } from "@/modules/ui/use-auto-hide-header-scroll"
import { collectTrackImages } from "@/modules/visuals/shared"
import { transformDBTrackToTrack } from "@/utils/transformers"
import LocalPlaylist02Icon from "@/modules/shared/components/icons/local/playlist-02"

const RECENTLY_ADDED_LIMIT = 8

export default function SearchScreen() {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const router = useRouter()
  const currentTrackId = useCurrentTrackId()
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [isTrackSheetOpen, setIsTrackSheetOpen] = useState(false)
  const [showMixActionSheet, setShowMixActionSheet] = useState(false)
  const [activeMixType, setActiveMixType] = useState<"daily" | "foryou" | null>(null)

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
      imageOverlay={currentTrackId === item.id ? <ScaleLoader size={28} /> : undefined}
    />
  )

  const handleSearchPress = () => {
    router.push("/(main)/(search)/search")
  }

  const handleMixLongPress = useCallback((mixId: string) => {
    setActiveMixType(mixId as "daily" | "foryou")
    setShowMixActionSheet(true)
  }, [])

  const handleCloseMixSheet = useCallback(() => {
    setShowMixActionSheet(false)
    setTimeout(() => setActiveMixType(null), 350)
  }, [])

  const dailyMixTracks = useMemo(() => dailyMix?.tracks ?? [], [dailyMix])
  const forYouMixTracks = useMemo(() => forYouMix?.tracks ?? [], [forYouMix])

  const activeMixId = activeMixType ?? ""
  const isActiveDaily = activeMixType === "daily"
  const activeMixTracks =
    activeMixType === "daily" ? dailyMixTracks : activeMixType === "foryou" ? forYouMixTracks : []
  const activeMixTitle = isActiveDaily
    ? t("home.topTracks.dailyMix", "Daily Mix")
    : t("home.topTracks.forYouMix", "For You Mix")
  const activeMixDesc = isActiveDaily
    ? t("home.topTracks.dailyMixDesc", "Fresh from your recent listening")
    : t("home.topTracks.forYouMixDesc", "Built from your longer-term taste")

  const handleSaveMixToPlaylist = useCallback(() => {
    if (!activeMixType) return
    setShowMixActionSheet(false)
    const tracks = activeMixType === "daily" ? dailyMixTracks : forYouMixTracks
    const trackIds = tracks.map((t) => t.id)
    setPlaylistFormDraft(trackIds, null)
    router.push("/playlist/form")
  }, [activeMixType, dailyMixTracks, forYouMixTracks, router])

  const dailyMixImages = useMemo(() => collectTrackImages(dailyMixTracks), [dailyMixTracks])

  const forYouMixImages = useMemo(() => collectTrackImages(forYouMixTracks), [forYouMixTracks])

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

  const activeMixImages =
    activeMixType && activeMixTracks.length > 0 ? collectTrackImages(activeMixTracks) : []

  const autoHideScrollProps = useAutoHideHeaderScroll()

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 220 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        {...autoHideScrollProps}
      >
        <View className="relative my-6 px-3">
          <View className="absolute top-1/2 left-7 z-10 -translate-y-1/2">
            <LocalSearch01Icon fill="none" width={24} height={24} color={theme.muted} />
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
          <MixCard
            title={t("home.topTracks.dailyMix", "Daily Mix")}
            images={dailyMixImages}
            color={dailyMixColor}
            pattern={dailyMixPattern}
            onPress={() => router.push("/(main)/(search)/mix/daily")}
            onLongPress={() => handleMixLongPress("daily")}
          />
          <MixCard
            title={t("home.topTracks.forYouMix", "For You Mix")}
            images={forYouMixImages}
            color={forYouMixColor}
            pattern={forYouMixPattern}
            onPress={() => router.push("/(main)/(search)/mix/foryou")}
            onLongPress={() => handleMixLongPress("foryou")}
          />
        </View>

        <ContentSection
          title={t("search.recentlyAdded")}
          data={recentlyAddedPreviewTracks}
          onViewMore={() => router.push("/(main)/(search)/recently-added")}
          emptyState={{
            icon: <LocalClock01SolidIcon fill="none" width={48} height={48} color={theme.muted} />,
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
      />
      <CollectionActionSheet
        visible={showMixActionSheet}
        onOpenChange={(v) => {
          if (!v) handleCloseMixSheet()
        }}
        type="mix"
        id={activeMixId}
        name={activeMixTitle}
        subtitle={activeMixDesc}
        image={activeMixImages[0]}
        images={activeMixImages}
        trackCount={activeMixTracks.length}
        hideFavoriteAction
      >
        <MenuRow
          icon={<LocalPlaylist02Icon fill="none" width={22} height={22} color={theme.muted} />}
          label={t("track.addToPlaylist")}
          onPress={handleSaveMixToPlaylist}
        />
      </CollectionActionSheet>
    </>
  )
}
