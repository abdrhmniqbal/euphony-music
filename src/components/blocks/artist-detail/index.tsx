import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { useState } from "react"
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useGuardedRouter } from "@/core/navigation"
import { useTranslation } from "react-i18next"
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import type { Album } from "@/components/blocks/album-grid"
import LocalChevronLeftIcon from "@/components/icons/local/chevron-left"
import { AlbumGrid } from "@/components/blocks/album-grid"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { SortSheet } from "@/components/blocks/sort-sheet"
import { TrackList } from "@/components/blocks/track-list"
import { TrackRow } from "@/components/patterns/track-row"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { SectionHeader } from "@/components/ui/section-header"
import { ArtistDetailHeader } from "./header"
import { ArtistHeroSection } from "./hero-section"
import { ArtistInfoSection } from "./info-section"
import { useArtistDetailData, type ArtistView } from "./use-artist-detail-data"
import { screenEnterTransition, screenExitTransition } from "@/lib/animations"
import { setSortConfig } from "@/domains/library/sort-store"
import {
  ALBUM_SORT_OPTIONS,
  ARTIST_TRACK_SORT_OPTIONS,
  resolveSortLabel,
} from "@/domains/library/sort-constants"
import { useToggleFavorite } from "@/domains/favorites/mutations"
import { useIsFavorite } from "@/domains/favorites/queries"
import { handleScroll } from "@/core/ui/store"
import { useThemeColors } from "@/core/theme/use-theme-colors"
import { useCurrentTrack } from "@/playback/selectors"
import { playTrack } from "@/playback/service"
import { usePlaybackActions } from "@/domains/library/detail-actions"

const SCROLL_SYNC_DELTA = 12

export function ArtistDetailScreen() {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const toggleFavoriteMutation = useToggleFavorite()
  const headerCollapseThreshold = screenWidth - 120
  const lastSyncedScrollYRef = React.useRef(0)

  const [isHeaderSolid, setIsHeaderSolid] = useState(false)
  const [activeView, setActiveView] = useState<ArtistView>("overview")
  const [sortModalVisible, setSortModalVisible] = useState(false)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const scrollY = useSharedValue(0)
  const currentTrack = useCurrentTrack()
  const router = useGuardedRouter()

  const {
    artistName,
    artistId,
    artistImage,
    artistBio,
    artistTransitionId,
    artistTracks,
    sortedArtistTracks,
    popularTracks,
    sortedAlbums,
    sortedFeaturedOnAlbums,
    hasAlbumSections,
    isLoading,
    sortConfig,
    currentTab,
  } = useArtistDetailData(activeView)
  const { data: isArtistFavorite = false } = useIsFavorite("artist", artistId ?? "")
  const displayedAlbums = activeView === "featuredOn" ? sortedFeaturedOnAlbums : sortedAlbums
  const displayedAlbumTitle =
    activeView === "featuredOn" ? t("library.featuredOn") : t("library.albums")

  const smoothScrollY = useDerivedValue(() => withTiming(scrollY.value, { duration: 90 }))

  const onScreenScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y
      scrollY.value = y
      handleScroll()

      const scrollDelta = Math.abs(y - lastSyncedScrollYRef.current)
      if (scrollDelta >= SCROLL_SYNC_DELTA || y <= 0) {
        lastSyncedScrollYRef.current = y
      }

      const nextHeaderSolid = y > headerCollapseThreshold
      setIsHeaderSolid((previous) => (previous === nextHeaderSolid ? previous : nextHeaderSolid))
    },
    [headerCollapseThreshold, scrollY]
  )

  const heroArtworkStyle = useAnimatedStyle(() => {
    const y = smoothScrollY.value
    return {
      transform: [
        { translateY: interpolate(y, [-220, 0, 220], [-52, 0, 0], Extrapolation.CLAMP) },
        { scale: interpolate(y, [-220, 0, 220], [1.22, 1.08, 1], Extrapolation.CLAMP) },
      ],
    }
  })

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ScaleLoader size={22} />
      </View>
    )
  }

  function handleSortSelect(field: (typeof ARTIST_TRACK_SORT_OPTIONS)[number]["field"], order?: "asc" | "desc") {
    setSortConfig(currentTab, field, order)
  }

  function navigateTo(view: ArtistView) {
    setActiveView(view)
  }

  function toggleArtistFavorite() {
    if (!artistId) {
      return
    }

    void toggleFavoriteMutation.mutateAsync({
      type: "artist",
      itemId: artistId,
      isCurrentlyFavorite: isArtistFavorite,
      name: artistName,
      subtitle: t("library.count.track", { count: artistTracks.length }),
      image: artistImage,
    })
  }

  function playArtistTrack(track: (typeof sortedArtistTracks)[number]) {
    void playTrack(track, sortedArtistTracks, { type: "artist", title: artistName })
  }

  const { playAll: playAllTracks, shuffle: shuffleTracks } = usePlaybackActions(
    sortedArtistTracks,
    artistName,
    "artist"
  )

  function openAlbum(album: Album) {
    router.push({
      pathname: "/album/[name]",
      params: { name: album.title },
    })
  }

  function getSortLabel() {
    const options = activeView === "tracks" ? ARTIST_TRACK_SORT_OPTIONS : ALBUM_SORT_OPTIONS
    return t(resolveSortLabel(options, sortConfig.field, t) || "library.sortBy")
  }

  const renderHeroSection = () => (
    <ArtistHeroSection
      screenWidth={screenWidth}
      heroArtworkStyle={heroArtworkStyle}
      artistImage={artistImage}
      mutedColor={theme.muted}
      backgroundColor={theme.background}
      artistName={artistName}
      trackCountLabel={t("library.count.track", { count: artistTracks.length })}
    />
  )

  return (
    <SortSheet
      visible={sortModalVisible}
      onOpenChange={setSortModalVisible}
      currentField={sortConfig.field}
      currentOrder={sortConfig.order}
      onSelect={handleSortSelect}
    >
      <View className="flex-1 bg-background">
        <ArtistDetailHeader
          topInset={insets.top}
          isHeaderSolid={isHeaderSolid}
          backgroundColor={theme.background}
          foregroundColor={theme.foreground}
          artistName={artistName}
          artistId={artistId}
          isArtistFavorite={isArtistFavorite}
          isFavoritePending={toggleFavoriteMutation.isPending}
          onBack={() => router.back()}
          onToggleFavorite={toggleArtistFavorite}
          onOpenActions={() => setShowActionSheet(true)}
        />

        {activeView === "overview" ? (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 200 }}
            onScroll={onScreenScroll}
            scrollEventThrottle={16}
          >
            {renderHeroSection()}

            <Animated.View
              key={activeView}
              entering={screenEnterTransition()}
              exiting={screenExitTransition()}
              style={{ paddingTop: 24 }}
            >
              <View className="px-6">
                <SectionHeader title={t("library.tracks")} onViewMore={() => navigateTo("tracks")} />
                <PlaybackActionsRow
                  onPlay={playAllTracks}
                  onShuffle={shuffleTracks}
                  className="mb-4"
                />
                <View style={{ gap: 8 }}>
                  {popularTracks.map((track) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      onPress={() => playArtistTrack(track)}
                      titleClassName={currentTrack?.id === track.id ? "text-accent" : undefined}
                      imageOverlay={
                        currentTrack?.id === track.id ? <ScaleLoader size={16} /> : undefined
                      }
                    />
                  ))}
                </View>
              </View>

              {sortedAlbums.length > 0 && (
                <View className="mt-8 px-6">
                  <SectionHeader title={t("library.albums")} onViewMore={() => navigateTo("albums")} />
                  <AlbumGrid horizontal data={sortedAlbums} onAlbumPress={openAlbum} />
                </View>
              )}

              {sortedFeaturedOnAlbums.length > 0 && (
                <View className="mt-8 px-6">
                  <SectionHeader
                    title={t("library.featuredOn")}
                    onViewMore={() => navigateTo("featuredOn")}
                  />
                  <AlbumGrid horizontal data={sortedFeaturedOnAlbums} onAlbumPress={openAlbum} />
                </View>
              )}

              {artistBio && <ArtistInfoSection title={t("library.artistInfo")} bio={artistBio} />}
            </Animated.View>
          </ScrollView>
        ) : activeView === "tracks" ? (
          <TrackList
            data={sortedArtistTracks}
            queueContext={{ type: "artist", title: artistName }}
            contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 24 }}
            onScroll={onScreenScroll as never}
            listHeader={
              <>
                <View style={{ marginHorizontal: -24 }}>{renderHeroSection()}</View>
                <Animated.View
                  entering={screenEnterTransition()}
                  style={{ paddingTop: 24 }}
                >
                  <View className="mb-4 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <PressableFeedback
                        onPress={() => navigateTo("overview")}
                        className="h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-default/55 active:opacity-50"
                      >
                        <LocalChevronLeftIcon fill="none" width={20} height={20} color={theme.muted} />
                      </PressableFeedback>
                      <Text className="text-[22px] font-semibold tracking-[-0.6px] text-foreground">
                        {t("library.allTracks")}
                      </Text>
                    </View>
                    <SortSheet.Trigger label={getSortLabel()} iconSize={14} />
                  </View>
                  <PlaybackActionsRow
                    onPlay={playAllTracks}
                    onShuffle={shuffleTracks}
                    className="mb-2"
                  />
                </Animated.View>
              </>
            }
          />
        ) : hasAlbumSections ? (
          <AlbumGrid
            data={displayedAlbums}
            onAlbumPress={openAlbum}
            onScroll={onScreenScroll as never}
            listHeader={
              <>
                <View>{renderHeroSection()}</View>
                <Animated.View entering={screenEnterTransition()} style={{ paddingTop: 24 }} className="px-6">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <PressableFeedback
                        onPress={() => navigateTo("overview")}
                        className="h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-default/55 active:opacity-50"
                      >
                        <LocalChevronLeftIcon fill="none" width={20} height={20} color={theme.muted} />
                      </PressableFeedback>
                      <Text className="text-[22px] font-semibold tracking-[-0.6px] text-foreground">
                        {displayedAlbumTitle}
                      </Text>
                    </View>
                    <SortSheet.Trigger label={getSortLabel()} iconSize={14} />
                  </View>
                </Animated.View>
              </>
            }
          />
        ) : (
          <View className="flex-1 bg-background" />
        )}

        {artistId ? (
          <CollectionActionSheet
            visible={showActionSheet}
            onOpenChange={setShowActionSheet}
            type="artist"
            id={artistName}
            favoriteId={artistId}
            name={artistName}
            subtitle={t("library.count.track", { count: sortedArtistTracks.length })}
            image={artistImage}
            trackCount={sortedArtistTracks.length}
          />
        ) : null}

        <SortSheet.Content
          options={
            activeView === "tracks"
              ? ARTIST_TRACK_SORT_OPTIONS
              : activeView === "albums" || activeView === "featuredOn"
                ? ALBUM_SORT_OPTIONS
                : []
          }
        />
      </View>
    </SortSheet>
  )
}
