/**
 * Purpose: Renders artist detail overview, artist tracks, artist albums, and artist header actions.
 * Caller: Expo Router artist detail route.
 * Dependencies: artist metadata and track queries, split artist settings, playback service, favorites mutations, sort store, media transition helpers, theme and UI scroll stores.
 * Main Functions: ArtistDetailsScreen(), trackMatchesArtistName(), mergeArtistTracks()
 * Side Effects: Starts context-aware playback, toggles artist favorites, navigates to album routes, updates scroll UI state.
 */

import type { SortField } from "@/modules/library/sort-types"
import type { Track } from "@/modules/player/store"
import { ArtistDetailHeader } from "./artist-detail-header"
import { ArtistHeroSection } from "./artist-hero-section"
import { ArtistInfoSection } from "./artist-info-section"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { useState } from "react"
import { useArtistDetailData } from "./use-artist-detail-data"

import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { type Album, AlbumGrid } from "@/modules/library/ui/album-grid"
import { CollectionActionSheet } from "@/modules/library/ui/collection-action-sheet"
import { PlaybackActionsRow } from "@/modules/player/ui/playback-actions-row"
import { SortSheet } from "@/modules/library/ui/sort-sheet"
import { TrackList } from "@/modules/tracks/ui/track-list"
import LocalChevronLeftIcon from "@/modules/shared/components/icons/local/chevron-left"
import { Stack } from "@/modules/shared/layouts/stack"
import { TrackRow } from "@/modules/tracks/ui/track-row"
import { ScaleLoader } from "@/modules/shared/components/ui/scale-loader"
import { SectionHeader } from "@/modules/shared/components/ui/section-header"
import { screenEnterTransition, screenExitTransition } from "@/modules/shared/constants/animations"
import { SCREEN_SECTION_HEADING_GAP, SCREEN_SECTION_TOP_SPACING } from "@/modules/shared/constants/layout"
import { resolveAlbumTransitionId } from "@/modules/artists/artist-transition"
import { useToggleFavorite } from "@/modules/favorites/mutations"
import { useIsFavorite } from "@/modules/favorites/queries"
import { ALBUM_SORT_OPTIONS, TRACK_SORT_OPTIONS } from "@/modules/library/sort-constants"
import { setSortConfig } from "@/modules/library/sort-store"
import { useCurrentTrack } from "@/modules/player/selectors"
import { useThemeColors } from "@/modules/ui/theme"
import { handleScroll } from "@/modules/ui/store"
import { playTrack } from "@/modules/player/service"
import { usePlaybackActions, useDetailScrollHandlers, resolveSortLabel } from "@/modules/library/ui/detail-helpers"

const SCROLL_SYNC_DELTA = 12

function setAnimatedValue<T>(target: { value: T }, nextValue: T) {
  target.value = nextValue
}

export default function ArtistDetailsScreen() {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const toggleFavoriteMutation = useToggleFavorite()
  const headerCollapseThreshold = screenWidth - 120
  const lastSyncedScrollYRef = React.useRef(0)

  const [isHeaderSolid, setIsHeaderSolid] = useState(false)
  const [activeView, setActiveView] = useState<"overview" | "tracks" | "albums" | "featuredOn">(
    "overview"
  )
  const [sortModalVisible, setSortModalVisible] = useState(false)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const scrollY = useSharedValue(0)
  const currentTrack = useCurrentTrack()

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
  const { data: isArtistFavorite = false } = useIsFavorite("artist", artistId || "")
  const displayedAlbums = activeView === "featuredOn" ? sortedFeaturedOnAlbums : sortedAlbums
  const displayedAlbumTitle =
    activeView === "featuredOn" ? t("library.featuredOn") : t("library.albums")

  const smoothScrollY = useDerivedValue(() => withTiming(scrollY.value, { duration: 90 }))

  const onScreenScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y
      setAnimatedValue(scrollY, y)

      const scrollDelta = Math.abs(y - lastSyncedScrollYRef.current)
      if (scrollDelta >= SCROLL_SYNC_DELTA || y <= 0) {
        handleScroll(y)
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
        {
          translateY: interpolate(y, [-220, 0, 220], [-52, 0, 0], Extrapolation.CLAMP),
        },
        {
          scale: interpolate(y, [-220, 0, 220], [1.22, 1.08, 1], Extrapolation.CLAMP),
        },
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

  function handleSortSelect(field: SortField, order?: "asc" | "desc") {
    setSortConfig(currentTab, field, order)
  }

  function navigateTo(view: "overview" | "tracks" | "albums" | "featuredOn") {
    setActiveView(view)
  }

  function handleBack() {
    router.back()
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
      subtitle: t("library.count.track", {
        count: artistTracks.length,
      }),
      image: artistImage,
    })
  }

  function playArtistTrack(track: Track) {
    playTrack(track, sortedArtistTracks, {
      type: "artist",
      title: artistName,
    })
  }

  const { playAll: playAllTracks, shuffle: shuffleTracks } = usePlaybackActions(
    sortedArtistTracks,
    { type: "artist", title: artistName }
  )
  const scrollHandlers = useDetailScrollHandlers()

  function openAlbum(album: Album) {
    router.push({
      pathname: "/album/[name]",
      params: {
        name: album.title,
        transitionId: resolveAlbumTransitionId({
          id: album.id,
          title: album.title,
        }),
      },
    })
  }

  function getSortLabel() {
    const options = activeView === "tracks" ? TRACK_SORT_OPTIONS : ALBUM_SORT_OPTIONS
    return resolveSortLabel(options, sortConfig.field, t)
  }

  const renderHeroSection = () => (
    <ArtistHeroSection
      screenWidth={screenWidth}
      artistTransitionId={artistTransitionId}
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
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <ArtistDetailHeader
          topInset={insets.top}
          isHeaderSolid={isHeaderSolid}
          backgroundColor={theme.background}
          foregroundColor={theme.foreground}
          artistName={artistName}
          artistId={artistId}
          isArtistFavorite={isArtistFavorite}
          isFavoritePending={toggleFavoriteMutation.isPending}
          onBack={handleBack}
          onToggleFavorite={toggleArtistFavorite}
          onOpenActions={() => setShowActionSheet(true)}
        />

        {activeView === "overview" ? (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 200 }}
            onScroll={onScreenScroll}
            {...scrollHandlers}
            scrollEventThrottle={16}
          >
            {renderHeroSection()}

            <Animated.View
              key={activeView}
              entering={screenEnterTransition()}
              exiting={screenExitTransition()}
              style={{ paddingTop: SCREEN_SECTION_TOP_SPACING }}
            >
              <View className="px-6">
                <SectionHeader
                  title={t("library.tracks")}
                  onViewMore={() => navigateTo("tracks")}
                />
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
                  <SectionHeader
                    title={t("library.albums")}
                    onViewMore={() => navigateTo("albums")}
                  />
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

              {artistBio && (
                <ArtistInfoSection
                  title={t("library.artistInfo", "About")}
                  bio={artistBio}
                />
              )}
            </Animated.View>
          </ScrollView>
        ) : activeView === "tracks" ? (
          <TrackList
            data={sortedArtistTracks}
            onTrackPress={playArtistTrack}
            resetScrollKey={`${artistId || artistName}-tracks-${sortConfig.field}-${sortConfig.order}`}
            contentContainerStyle={{
              paddingBottom: 200,
              paddingHorizontal: 24,
            }}
            onScroll={onScreenScroll}
            {...scrollHandlers}
            listHeader={
              <>
                <View style={{ marginHorizontal: -24 }}>{renderHeroSection()}</View>
                <Animated.View
                  entering={screenEnterTransition()}
                  style={{ paddingTop: SCREEN_SECTION_TOP_SPACING }}
                >
                  <View
                    className="flex-row items-center justify-between"
                    style={{ marginBottom: SCREEN_SECTION_HEADING_GAP }}
                  >
                    <View className="flex-row items-center gap-3">
                      <PressableFeedback
                        onPress={() => navigateTo("overview")}
                        className="h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-default/55 active:opacity-50"
                      >
                        <LocalChevronLeftIcon
                          fill="none"
                          width={20}
                          height={20}
                          color={theme.muted}
                        />
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
            resetScrollKey={`${artistId || artistName}-${activeView}-${sortConfig.field}-${sortConfig.order}`}
            contentContainerStyle={{
              paddingBottom: 200,
              paddingHorizontal: 16,
            }}
            onScroll={onScreenScroll}
            {...scrollHandlers}
            listHeader={
              <>
                <View style={{ marginHorizontal: -16 }}>{renderHeroSection()}</View>
                <Animated.View
                  entering={screenEnterTransition()}
                  className="px-2"
                  style={{ paddingTop: SCREEN_SECTION_TOP_SPACING }}
                >
                  <View
                    className="flex-row items-center justify-between"
                    style={{ marginBottom: SCREEN_SECTION_HEADING_GAP }}
                  >
                    <View className="flex-row items-center gap-3">
                      <PressableFeedback
                        onPress={() => navigateTo("overview")}
                        className="h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-default/55 active:opacity-50"
                      >
                        <LocalChevronLeftIcon
                          fill="none"
                          width={20}
                          height={20}
                          color={theme.muted}
                        />
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
              ? TRACK_SORT_OPTIONS
              : activeView === "albums" || activeView === "featuredOn"
                ? ALBUM_SORT_OPTIONS
                : []
          }
        />
      </View>
    </SortSheet>
  )
}
