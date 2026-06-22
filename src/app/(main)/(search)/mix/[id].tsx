import { useLocalSearchParams } from "expo-router"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { useMemo, useState } from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import Animated from "react-native-reanimated"

import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { TrackList } from "@/components/blocks/track-list"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import { BackButton } from "@/components/patterns/back-button"
import { PlaylistArtwork } from "@/components/patterns/playlist-artwork"
import { EmptyState } from "@/components/ui/empty-state"
import { screenEnterTransition } from "@/constants/animations"
import { DETAIL_HEADER_BOTTOM_SPACING, SCREEN_SECTION_TOP_SPACING } from "@/constants/layout"
import { Stack } from "@/layouts/stack"
import { playTrack } from "@/modules/player/service"
import { useDailyMix, useForYouMix } from "@/modules/mixes/queries"
import { formatDuration } from "@/modules/playlist/utils"
import { useThemeColors } from "@/modules/ui/theme"
import { handleScroll, handleScrollStart, handleScrollStop } from "@/modules/ui/store"
import type { Track } from "@/modules/player/types"

const HEADER_COLLAPSE_THRESHOLD = 120

export default function MixDetailsScreen() {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const mixId = id ?? "daily"

  const [showHeaderTitle, setShowHeaderTitle] = useState(false)

  const isDaily = mixId === "daily"
  const { data: dailyMix, isLoading: isDailyLoading } = useDailyMix()
  const { data: forYouMix, isLoading: isForYouLoading } = useForYouMix()

  const tracks = isDaily ? (dailyMix?.tracks ?? []) : (forYouMix?.tracks ?? [])
  const isLoading = isDaily ? isDailyLoading : isForYouLoading

  const title = isDaily
    ? t("home.topTracks.dailyMix", "Daily Mix")
    : t("home.topTracks.forYouMix", "For You Mix")
  const description = isDaily
    ? t("home.topTracks.dailyMixDesc", "Fresh from your recent listening")
    : t("home.topTracks.forYouMixDesc", "Built from your longer-term taste")
  const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0)
  const metaText = `${t("library.count.track", { count: tracks.length })} • ${formatDuration(totalDuration)}`

  const images = useMemo(() => {
    return tracks.map((t) => t.image).filter(Boolean) as string[]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks])

  function handleBack() {
    router.back()
  }

  function handlePlayMix() {
    if (tracks.length === 0) return
    playTrack(tracks[0], tracks, { type: "trackList", title })
  }

  function handleShuffleMix() {
    if (tracks.length === 0) return
    const randomIndex = Math.floor(Math.random() * tracks.length)
    playTrack(tracks[randomIndex], tracks, { type: "trackList", title })
  }

  function handleTrackScroll(offsetY: number) {
    handleScroll(offsetY)
    const shouldShow = offsetY > HEADER_COLLAPSE_THRESHOLD
    if (shouldShow !== showHeaderTitle) {
      setShowHeaderTitle(shouldShow)
    }
  }

  function handleTrackPress(track: Track) {
    playTrack(track, tracks, { type: "trackList", title })
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: showHeaderTitle ? title : "",
          headerBackVisible: false,
          headerLeft: () => <BackButton className="-ml-2" onPress={handleBack} />,
        }}
      />

      <TrackList
        data={tracks}
        onTrackPress={handleTrackPress}
        showNumbers={false}
        hideCover={false}
        hideArtist={false}
        contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 16 }}
        onScroll={(e) => handleTrackScroll(e.nativeEvent.contentOffset.y)}
        onScrollBeginDrag={handleScrollStart}
        onMomentumScrollEnd={handleScrollStop}
        onScrollEndDrag={handleScrollStop}
        listHeader={
          <>
            <View
              style={{
                paddingTop: SCREEN_SECTION_TOP_SPACING,
                paddingBottom: DETAIL_HEADER_BOTTOM_SPACING,
              }}
            >
              <View className="flex-row gap-4">
                <View className="h-36 w-36 overflow-hidden rounded-lg bg-surface-secondary">
                  <PlaylistArtwork images={images} className="bg-surface-secondary" />
                </View>

                <View className="flex-1 justify-center">
                  <Text className="text-xl font-bold text-foreground" numberOfLines={2}>
                    {title}
                  </Text>
                  <Text className="mt-1 text-base text-muted" numberOfLines={2}>
                    {description}
                  </Text>
                  <Text className="mt-2 text-sm text-muted">{metaText}</Text>
                </View>
              </View>
            </View>

            <Animated.View entering={screenEnterTransition()}>
              <PlaybackActionsRow
                onPlay={handlePlayMix}
                onShuffle={handleShuffleMix}
                disabled={tracks.length === 0}
                className="mb-4"
              />
            </Animated.View>

            <View className="flex-row items-center justify-between" style={{ marginBottom: 8 }}>
              <Text className="text-lg font-bold text-foreground">
                {t("library.count.track", { count: tracks.length })}
              </Text>
            </View>
          </>
        }
        listEmpty={
          !isLoading ? (
            <EmptyState
              icon={<LocalMusicNoteSolidIcon fill="none" width={48} height={48} color={theme.muted} />}
              title={t("library.empty.noTracksTitle", "No tracks yet")}
              message={t("library.empty.noTracksMessage", "This mix could not be built because there isn't enough library data.")}
            />
          ) : null
        }
      />
    </View>
  )
}
