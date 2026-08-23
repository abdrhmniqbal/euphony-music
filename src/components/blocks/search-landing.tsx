import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

import { Input, PressableFeedback } from "heroui-native"

import LocalClock01SolidIcon from "@/components/icons/local/clock-01-solid"
import LocalPlaylist02Icon from "@/components/icons/local/playlist-02"
import LocalSearch01Icon from "@/components/icons/local/search-01"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import { ContentSection } from "@/components/blocks/content-section"
import { MediaCarousel } from "@/components/blocks/media-carousel"
import { TrackActionSheet } from "@/components/blocks/track-action-sheet"
import { TrackRow } from "@/components/patterns/track-row"
import { MixCard } from "@/components/patterns/mix-card"
import { MenuRow } from "@/components/ui/menu-row"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { useGuardedRouter } from "@/core/navigation"
import { getPreferenceState } from "@/core/preferences/store"
import { useThemeColors } from "@/core/theme/use-theme-colors"
import { setPlaylistFormDraft } from "@/domains/playlists/form-draft-store"
import { toPlayerTracks } from "@/playback/player-track"
import type { PlayerTrack } from "@/playback/types"
import { createPlaybackQueueContext } from "@/playback/types"
import { useCurrentTrackId } from "@/playback/selectors"
import { playTrack } from "@/playback/service"
import { useTracks } from "@/domains/tracks/queries"
import { useDailyMix, useForYouMix } from "@/domains/mixes/queries"
import { collectTrackImages } from "@/domains/visuals/shared"
import { useAutoHideHeaderScroll } from "@/core/ui/use-auto-hide-header-scroll"

const RECENTLY_ADDED_LIMIT = 8

export function SearchLandingScreen() {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const router = useGuardedRouter()
  const currentTrackId = useCurrentTrackId()
  const [selectedTrack, setSelectedTrack] = useState<PlayerTrack | null>(null)
  const [isTrackSheetOpen, setIsTrackSheetOpen] = useState(false)
  const [showMixActionSheet, setShowMixActionSheet] = useState(false)
  const [activeMixType, setActiveMixType] = useState<"daily" | "foryou" | null>(null)

  const { data: dailyMix } = useDailyMix()
  const { data: forYouMix } = useForYouMix()

  const { data: dbTracksData = [] } = useTracks()

  const recentlyAddedTracks = React.useMemo(
    () =>
      toPlayerTracks(dbTracksData, getPreferenceState().splitMultipleValueConfig).sort(
        (a, b) => (b.dateAdded ?? 0) - (a.dateAdded ?? 0)
      ),
    [dbTracksData]
  )
  const recentlyAddedPreviewTracks = recentlyAddedTracks.slice(0, RECENTLY_ADDED_LIMIT)

  const openTrackSheet = useCallback((track: PlayerTrack) => {
    setSelectedTrack(track)
    setIsTrackSheetOpen(true)
  }, [])

  const queueContext = createPlaybackQueueContext("trackList", t("search.recentlyAdded"))

  const renderRecentlyAddedItem = (item: PlayerTrack) => (
    <TrackRow
      track={item}
      variant="grid"
      onPress={() => playTrack(item, recentlyAddedTracks, queueContext)}
      onLongPress={() => openTrackSheet(item)}
      titleClassName={currentTrackId === item.id ? "text-accent" : undefined}
      imageOverlay={currentTrackId === item.id ? <ScaleLoader size={28} /> : undefined}
    />
  )

  const dailyMixTracks = useMemo(() => dailyMix?.tracks ?? [], [dailyMix])
  const forYouMixTracks = useMemo(() => forYouMix?.tracks ?? [], [forYouMix])

  const activeMixTracks =
    activeMixType === "daily" ? dailyMixTracks : activeMixType === "foryou" ? forYouMixTracks : []
  const activeMixTitle =
    activeMixType === "daily" ? t("search.dailyMix") : t("search.forYouMix")
  const activeMixDesc =
    activeMixType === "daily"
      ? t("search.dailyMixDesc")
      : t("search.forYouMixDesc")

  const handleSaveMixToPlaylist = useCallback(() => {
    if (!activeMixType) {
      return
    }
    setShowMixActionSheet(false)
    setPlaylistFormDraft(activeMixTracks.map((track) => track.id))
    router.push("/playlist/form")
  }, [activeMixTracks, activeMixType, router])

  const dailyMixImages = useMemo(() => collectTrackImages(dailyMixTracks.map((t) => t.image)), [dailyMixTracks])
  const forYouMixImages = useMemo(() => collectTrackImages(forYouMixTracks.map((t) => t.image)), [forYouMixTracks])

  const dailyMixColor = useMemo(() => {
    if (!theme.rainbow || theme.rainbow.length === 0) return "#3b82f6"
    return theme.rainbow[(dailyMix?.colorIndex ?? 0) % theme.rainbow.length]
  }, [theme.rainbow, dailyMix])

  const forYouMixColor = useMemo(() => {
    if (!theme.rainbow || theme.rainbow.length === 0) return "#8b5cf6"
    return theme.rainbow[(forYouMix?.colorIndex ?? 0) % theme.rainbow.length]
  }, [theme.rainbow, forYouMix])

  const activeMixImages =
    activeMixType && activeMixTracks.length > 0 ? collectTrackImages(activeMixTracks.map((t) => t.image)) : []

  const autoHideScrollProps = useAutoHideHeaderScroll()

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 220 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...autoHideScrollProps}
      >
        <View className="relative my-6 px-3">
          <View className="absolute left-7 top-1/2 z-10 -translate-y-1/2">
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
            onPress={() => router.push("/(main)/(search)/search")}
            className="absolute inset-0 z-20"
            accessibilityRole="button"
            accessibilityLabel={t("search.openSearch")}
          />
        </View>

        <View className="mb-6 flex-row gap-3 px-4">
          <MixCard
            title={t("search.dailyMix")}
            images={dailyMixImages}
            color={dailyMixColor}
            pattern={dailyMix?.shape ?? "circles"}
            onPress={() => router.push("/(main)/(search)/mix/daily")}
            onLongPress={() => {
              setActiveMixType("daily")
              setShowMixActionSheet(true)
            }}
          />
          <MixCard
            title={t("search.forYouMix")}
            images={forYouMixImages}
            color={forYouMixColor}
            pattern={forYouMix?.shape ?? "circles"}
            onPress={() => router.push("/(main)/(search)/mix/foryou")}
            onLongPress={() => {
              setActiveMixType("foryou")
              setShowMixActionSheet(true)
            }}
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
        onOpenChange={(visible) => {
          if (!visible) {
            setShowMixActionSheet(false)
            return
          }
        }}
        type="mix"
        id={activeMixType ?? ""}
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
