import { Image } from 'expo-image'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Button } from 'heroui-native'
import * as React from 'react'
import { useState } from 'react'
import { Text, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'

import { PlaybackActionsRow } from '@/components/blocks'
import { LibrarySkeleton } from '@/components/blocks/library-skeleton'
import { SortSheet } from '@/components/blocks/sort-sheet'
import { TrackList } from '@/components/blocks/track-list'
import LocalFavouriteIcon from '@/components/icons/local/favourite'
import LocalFavouriteSolidIcon from '@/components/icons/local/favourite-solid'
import LocalVynilSolidIcon from '@/components/icons/local/vynil-solid'
import { BackButton } from '@/components/patterns'
import { EmptyState } from '@/components/ui'
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from '@/hooks/scroll-bars.store'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useAlbumDetailsScreen } from '@/modules/albums/hooks/use-album-details-screen'
import { useToggleFavorite } from '@/modules/favorites/favorites.queries'
import {
  type SortField,
  TRACK_SORT_OPTIONS,
} from '@/modules/library/library-sort.store'

const HEADER_COLLAPSE_THRESHOLD = 120

export default function AlbumDetailsScreen() {
  const theme = useThemeColors()
  const router = useRouter()
  const toggleFavoriteMutation = useToggleFavorite()
  const { from, query } = useLocalSearchParams<{
    from?: string
    query?: string
  }>()
  const [sortModalVisible, setSortModalVisible] = useState(false)
  const [showHeaderTitle, setShowHeaderTitle] = useState(false)

  const {
    albumInfo,
    isLoading,
    albumId,
    isAlbumFavorite,
    sortedTracks,
    sortConfig,
    totalDurationLabel,
    playSelectedTrack,
    playAllTracks,
    shuffleTracks,
    selectSort,
    getSortLabel,
  } = useAlbumDetailsScreen()

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <LibrarySkeleton type="album-detail" />
      </View>
    )
  }

  function handleSortSelect(field: SortField, order?: 'asc' | 'desc') {
    selectSort(field, order)
  }

  function handleBack() {
    if (from === 'search') {
      router.replace({
        pathname: '/search-interaction',
        params: query ? { query } : {},
      })
      return
    }

    router.back()
  }

  if (!albumInfo) {
    return (
      <EmptyState
        icon={(
          <LocalVynilSolidIcon
            fill="none"
            width={48}
            height={48}
            color={theme.muted}
          />
        )}
        title="No albums found"
        message="No albums found"
        className="mt-12"
      />
    )
  }

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
            title: showHeaderTitle ? albumInfo.title : '',
            headerBackVisible: false,
            headerLeft: () => (
              <BackButton className="-ml-2" onPress={handleBack} />
            ),
            headerRight: () =>
              albumId && (
                <Button
                  onPress={() => {
                    if (!albumId) {
                      return
                    }

                    void toggleFavoriteMutation.mutateAsync({
                      type: 'album',
                      itemId: albumId,
                      isCurrentlyFavorite: isAlbumFavorite,
                      name: albumInfo.title,
                      subtitle: albumInfo.artist,
                      image: albumInfo.image,
                    })
                  }}
                  isDisabled={toggleFavoriteMutation.isPending}
                  variant="ghost"
                  className="-mr-2"
                  isIconOnly
                >
                  {isAlbumFavorite
                    ? (
                        <LocalFavouriteSolidIcon
                          fill="none"
                          width={24}
                          height={24}
                          color="#ef4444"
                        />
                      )
                    : (
                        <LocalFavouriteIcon
                          fill="none"
                          width={24}
                          height={24}
                          color={theme.foreground}
                        />
                      )}
                </Button>
              ),
          }}
        />
        <TrackList
          data={sortedTracks}
          showNumbers
          hideCover
          hideArtist
          getNumber={(track, index) => track.trackNumber || index + 1}
          onTrackPress={playSelectedTrack}
          resetScrollKey={`${albumId || albumInfo.title}-${sortConfig.field}-${sortConfig.order}`}
          contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 16 }}
          onScroll={(event) => {
            const y = event.nativeEvent.contentOffset.y
            handleScroll(y)
            const nextShowHeaderTitle = y > HEADER_COLLAPSE_THRESHOLD
            if (nextShowHeaderTitle !== showHeaderTitle) {
              setShowHeaderTitle(nextShowHeaderTitle)
            }
          }}
          onScrollBeginDrag={handleScrollStart}
          onMomentumScrollEnd={handleScrollStop}
          onScrollEndDrag={handleScrollStop}
          listHeader={(
            <>
              <View className="pb-6">
                <View className="flex-row gap-4 pt-6">
                  <View className="h-36 w-36 overflow-hidden rounded-lg bg-surface-secondary">
                    {albumInfo.image
                      ? (
                          <Image
                            source={{ uri: albumInfo.image }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                          />
                        )
                      : (
                          <View className="h-full w-full items-center justify-center">
                            <LocalVynilSolidIcon
                              fill="none"
                              width={48}
                              height={48}
                              color={theme.muted}
                            />
                          </View>
                        )}
                  </View>

                  <View className="flex-1 justify-center">
                    <Text
                      className="text-xl font-bold text-foreground"
                      numberOfLines={1}
                    >
                      {albumInfo.title}
                    </Text>
                    <Text className="mt-1 text-sm text-muted" numberOfLines={1}>
                      {albumInfo.artist}
                    </Text>
                    <Text className="mt-2 text-sm text-muted">
                      {albumInfo.year ? `${albumInfo.year}` : ''}
                      {' '}
                      ·
                      {' '}
                      {totalDurationLabel}
                    </Text>
                  </View>
                </View>
              </View>

              <Animated.View entering={FadeIn.duration(300)}>
                <PlaybackActionsRow
                  onPlay={playAllTracks}
                  onShuffle={shuffleTracks}
                />
              </Animated.View>

              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-lg font-bold text-foreground">
                  {sortedTracks.length}
                  {' '}
                  Tracks
                </Text>
                <SortSheet.Trigger label={getSortLabel()} iconSize={16} />
              </View>
            </>
          )}
        />

        <SortSheet.Content options={TRACK_SORT_OPTIONS} />
      </View>
    </SortSheet>
  )
}
