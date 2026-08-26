import { Stack, useLocalSearchParams } from "expo-router"
import { Button, useThemeColor } from "heroui-native"
import { useCallback, useMemo, useState } from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import Animated, { FadeIn } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import LocalMoreHorizontalCircle01SolidIcon from "@/components/icons/local/more-horizontal-circle-01-solid"
import LocalMixMaxItemsIcon from "@/components/icons/local/mix-max-items"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import LocalPlaylist02Icon from "@/components/icons/local/playlist-02"
import { MenuRow } from "@/components/ui/menu-row"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import { TrackList } from "@/components/blocks/track-list"
import { SortSheet } from "@/components/blocks/sort-sheet"
import { BackButton } from "@/components/patterns/back-button"
import { PlaylistArtwork } from "@/components/patterns/playlist-artwork"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDurationCompact } from "@/lib/format"
import { useGuardedRouter } from "@/core/navigation"
import { setPlaylistFormDraft } from "@/domains/playlists/form-draft-store"
import {
  MIX_TRACK_SORT_OPTIONS,
  resolveSortLabel,
  type SortOptionField,
} from "@/domains/library/sort-constants"
import { sortPlayerTracks, type DetailSortField } from "@/domains/tracks/detail-sort"
import { useDailyMix, useForYouMix } from "@/domains/mixes/queries"
import { MixMaxItemsSheet } from "@/components/blocks/mix-max-items-sheet"
import { collectTrackImages } from "@/domains/visuals/shared"
import type { PlayerTrack } from "@/playback/types"
import { createPlaybackQueueContext } from "@/playback/types"
import { playTrack } from "@/playback/service"
import { useAutoHideHeaderScroll } from "@/core/ui/use-auto-hide-header-scroll"
import { usePreferenceStore } from "@/core/preferences/store"

const HEADER_COLLAPSE_THRESHOLD = 120

export function MixDetailScreen() {
  const { t } = useTranslation()
  const [foreground, muted] = useThemeColor(["foreground", "muted"])
  const insets = useSafeAreaInsets()
  const router = useGuardedRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const mixId = id ?? "daily"

  const [showHeaderTitle, setShowHeaderTitle] = useState(false)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [showMaxItemsSheet, setShowMaxItemsSheet] = useState(false)
  const [showSortSheet, setShowSortSheet] = useState(false)
  const [sortField, setSortField] = useState<SortOptionField>("mixOrder")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const maxMixItems = usePreferenceStore((state) => state.maxMixItems)

  const isDaily = mixId === "daily"
  const { data: dailyMix, isLoading: isDailyLoading } = useDailyMix()
  const { data: forYouMix, isLoading: isForYouLoading } = useForYouMix()

  const tracks = useMemo(
    () => (isDaily ? (dailyMix?.tracks ?? []) : (forYouMix?.tracks ?? [])),
    [isDaily, dailyMix?.tracks, forYouMix?.tracks]
  )
  const isLoading = isDaily ? isDailyLoading : isForYouLoading
  const mixData = isDaily ? dailyMix : forYouMix

  const title = isDaily ? t("search.dailyMix") : t("search.forYouMix")
  const description = isDaily ? t("search.dailyMixDesc") : t("search.forYouMixDesc")
  const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0)

  const images = useMemo(() => collectTrackImages(tracks.map((t) => t.image)), [tracks])

  const sortedTracks = useMemo(
    () =>
      sortField === "mixOrder"
        ? tracks
        : // SAFETY: MIX_TRACK_SORT_OPTIONS excludes the playlist-only pseudo fields, so what remains is a DetailSortField
          sortPlayerTracks(tracks, {
            field: sortField as DetailSortField,
            order: sortOrder,
          }),
    [tracks, sortField, sortOrder]
  )
  const sortLabel = resolveSortLabel(MIX_TRACK_SORT_OPTIONS, sortField)

  const queueContext = createPlaybackQueueContext("mix", title)

  function handlePlayMix() {
    if (sortedTracks.length === 0) return
    playTrack(sortedTracks[0], sortedTracks, queueContext)
  }

  function handleShuffleMix() {
    if (sortedTracks.length === 0) return
    const randomIndex = Math.floor(Math.random() * sortedTracks.length)
    playTrack(sortedTracks[randomIndex], sortedTracks, queueContext)
  }

  const handleSaveToPlaylist = useCallback(() => {
    setShowActionSheet(false)
    setPlaylistFormDraft(tracks.map((track) => track.id))
    router.push("/playlist/form")
  }, [router, tracks])

  const autoHideScrollProps = useAutoHideHeaderScroll()

  function handleTrackScroll(offsetY: number) {
    // SAFETY: only nativeEvent.contentOffset.y is read downstream; the rest of the scroll event is unused
    autoHideScrollProps.onScroll({ nativeEvent: { contentOffset: { y: offsetY } } } as never)
    const shouldShow = offsetY > HEADER_COLLAPSE_THRESHOLD
    if (shouldShow !== showHeaderTitle) {
      setShowHeaderTitle(shouldShow)
    }
  }

  function handleTrackPress(track: PlayerTrack) {
    playTrack(track, sortedTracks, queueContext)
  }

  function handleSortSelect(field: SortOptionField, order?: "asc" | "desc") {
    const isNewField = field !== sortField
    setSortField(field)
    setSortOrder(isNewField ? (order ?? "asc") : (order ?? sortOrder))
  }

  return (
    <SortSheet
      visible={showSortSheet}
      onOpenChange={setShowSortSheet}
      currentField={sortField}
      currentOrder={sortOrder}
      onSelect={handleSortSelect}
    >
      <View className="flex-1 bg-background">
        <Stack.Screen
          options={{
            title: showHeaderTitle ? title : "",
            headerBackVisible: false,
            headerLeft: () => <BackButton className="-ml-2" fallbackHref="/(main)/(search)" />,
            headerRight: () =>
              tracks.length > 0 ? (
                <Button
                  variant="ghost"
                  isIconOnly
                  onPress={() => setShowActionSheet(true)}
                  className="-mr-2"
                >
                  <LocalMoreHorizontalCircle01SolidIcon
                    fill="none"
                    width={24}
                    height={24}
                    color={foreground}
                  />
                </Button>
              ) : null,
          }}
        />
        <TrackList
        data={sortedTracks}
        onTrackPress={handleTrackPress}
        contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 16 }}
        {...autoHideScrollProps}
        onScroll={(event) => handleTrackScroll(event.nativeEvent.contentOffset.y)}
        listHeader={
          <>
            <View className="pt-6 pb-6">
              <View className="flex-row gap-4">
                <View className="h-36 w-36 overflow-hidden rounded-lg bg-default">
                  <PlaylistArtwork images={images} />
                </View>

                <View className="flex-1 justify-center">
                  <Text className="text-xl font-bold text-foreground" numberOfLines={2}>
                    {title}
                  </Text>
                  <Text className="mt-1 text-base text-muted" numberOfLines={2}>
                    {description}
                  </Text>
                  <Text className="mt-2 text-sm text-muted">
                    {mixData?.generatedAt
                      ? `${new Intl.DateTimeFormat(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(mixData.generatedAt)} • `
                      : ""}
                    {formatDurationCompact(totalDuration)}
                  </Text>
                </View>
              </View>
            </View>

            {tracks.length > 0 ? (
              <Animated.View entering={FadeIn}>
                <PlaybackActionsRow
                  onPlay={handlePlayMix}
                  onShuffle={handleShuffleMix}
                  className="mb-4"
                />
              </Animated.View>
            ) : null}

            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">
                {t("library.count.track", { count: tracks.length })}
              </Text>
              <SortSheet.Trigger label={t(sortLabel || "library.sortBy")} iconSize={16} />
            </View>
          </>
        }
      />

      <CollectionActionSheet
        visible={showActionSheet}
        onOpenChange={setShowActionSheet}
        type="mix"
        id={mixId}
        name={title}
        subtitle={description}
        image={images[0]}
        images={images}
        trackCount={tracks.length}
        hideFavoriteAction
      >
        <MenuRow
          icon={<LocalPlaylist02Icon fill="none" width={22} height={22} color={muted} />}
          label={t("track.addToPlaylist")}
          onPress={handleSaveToPlaylist}
        />
        <MenuRow
          icon={<LocalMixMaxItemsIcon fill="none" width={22} height={22} color={muted} />}
          label={t("mix.maxItems")}
          trailing={<Text className="text-base text-muted">{maxMixItems}</Text>}
          onPress={() => {
            setShowActionSheet(false)
            setShowMaxItemsSheet(true)
          }}
        />
      </CollectionActionSheet>

      <MixMaxItemsSheet isOpen={showMaxItemsSheet} onOpenChange={setShowMaxItemsSheet} />

      {tracks.length === 0 && !isLoading ? (
        <View style={{ paddingTop: insets.top + 8 }} className="px-4">
          <BackButton className="-ml-2 mb-4" fallbackHref="/(main)/(search)" />
          <EmptyState
            icon={<LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={muted} />}
            title={t("library.empty.noTracksTitle")}
            message={t("library.empty.noTracksMessage")}
          />
        </View>
      ) : null}
      </View>
    </SortSheet>
  )
}
