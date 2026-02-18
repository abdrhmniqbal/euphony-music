import * as React from "react"
import { Skeleton } from "heroui-native"
import { View } from "react-native"

type LibrarySkeletonType =
  | "tracks"
  | "tracks-compact"
  | "albums"
  | "artists"
  | "genres"
  | "home"
  | "search-results"
  | "genre-overview"
  | "album-detail"
  | "artist-detail"
  | "playlist-detail"
  | "playlist-form"

interface LibrarySkeletonProps {
  type: LibrarySkeletonType
  itemCount?: number
  className?: string
}

function SectionHeaderSkeleton() {
  return (
    <View className="mb-3 flex-row items-center justify-between px-4">
      <Skeleton className="h-6 w-32 rounded-md" />
      <Skeleton className="h-4 w-14 rounded-md" />
    </View>
  )
}

function PlaybackActionsSkeleton() {
  return (
    <View className="mb-4 flex-row gap-3">
      <Skeleton className="h-10 flex-1 rounded-xl" />
      <Skeleton className="h-10 flex-1 rounded-xl" />
    </View>
  )
}

function TrackRowSkeleton({
  showCover = true,
  showRank = false,
}: {
  showCover?: boolean
  showRank?: boolean
}) {
  return (
    <View className="flex-row items-center gap-3 py-2">
      {showCover ? <Skeleton className="h-14 w-14 rounded-lg" /> : null}
      {showRank ? <Skeleton className="h-4 w-5 rounded-sm" /> : null}
      <View className="flex-1 gap-1">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </View>
      <Skeleton className="h-6 w-6 rounded-full" />
    </View>
  )
}

function TrackListSkeleton({
  itemCount = 8,
  showCover = true,
  showRank = false,
}: {
  itemCount?: number
  showCover?: boolean
  showRank?: boolean
}) {
  return (
    <View className="gap-2">
      {Array.from({ length: itemCount }, (_, index) => (
        <TrackRowSkeleton
          key={`track-skeleton-${index}`}
          showCover={showCover}
          showRank={showRank}
        />
      ))}
    </View>
  )
}

function AlbumGridSkeleton({ itemCount = 8 }: { itemCount?: number }) {
  const rows = []
  for (let i = 0; i < itemCount; i += 2) {
    rows.push(
      <View key={`album-row-${i}`} className="flex-row justify-between">
        {Array.from({ length: Math.min(2, itemCount - i) }, (_, offset) => (
          <View key={`album-card-${i + offset}`} className="w-[48.5%]">
            <Skeleton className="aspect-square w-full rounded-md" />
            <View className="mt-2 gap-1">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </View>
          </View>
        ))}
      </View>
    )
  }

  return <View className="gap-4">{rows}</View>
}

function ArtistGridSkeleton({ itemCount = 9 }: { itemCount?: number }) {
  const rows = []
  for (let i = 0; i < itemCount; i += 3) {
    rows.push(
      <View key={`artist-row-${i}`} className="flex-row gap-3">
        {Array.from({ length: Math.min(3, itemCount - i) }, (_, offset) => (
          <View key={`artist-card-${i + offset}`} className="w-[31.5%] items-center">
            <Skeleton className="aspect-square w-full rounded-full" />
            <View className="mt-2 w-full items-center gap-1">
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-3 w-3/5 rounded" />
            </View>
          </View>
        ))}
      </View>
    )
  }

  return <View className="gap-4">{rows}</View>
}

function GenreGridSkeleton({ itemCount = 8 }: { itemCount?: number }) {
  const rows = []
  for (let i = 0; i < itemCount; i += 2) {
    rows.push(
      <View key={`genre-row-${i}`} className="flex-row justify-between">
        {Array.from({ length: Math.min(2, itemCount - i) }, (_, offset) => (
          <View key={`genre-card-${i + offset}`} className="w-[47.5%]">
            <Skeleton className="h-24 w-full rounded-2xl" />
          </View>
        ))}
      </View>
    )
  }

  return <View className="gap-4">{rows}</View>
}

function HomeSkeleton() {
  return (
    <View>
      <SectionHeaderSkeleton />
      <View className="mb-8 flex-row gap-3 px-4">
        {Array.from({ length: 3 }, (_, index) => (
          <View key={`home-media-${index}`} className="w-36">
            <Skeleton className="h-36 w-full rounded-xl" />
            <View className="mt-2 gap-1">
              <Skeleton className="h-4 w-10/12 rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </View>
          </View>
        ))}
      </View>

      <SectionHeaderSkeleton />
      <View className="px-4">
        <TrackListSkeleton itemCount={6} />
      </View>
    </View>
  )
}

function SearchResultsSkeleton() {
  return (
    <View>
      <View className="mb-3">
        <Skeleton className="h-6 w-20 rounded-md" />
      </View>
      <TrackListSkeleton itemCount={7} />
    </View>
  )
}

function GenreOverviewSkeleton() {
  return (
    <View>
      <SectionHeaderSkeleton />
      <View className="px-4">
        <TrackListSkeleton itemCount={4} />
      </View>
      <View className="mt-8">
        <SectionHeaderSkeleton />
      </View>
      <View className="mt-1 flex-row gap-3 px-4">
        {Array.from({ length: 2 }, (_, index) => (
          <View key={`genre-album-preview-${index}`} className="w-36">
            <Skeleton className="h-36 w-full rounded-xl" />
            <View className="mt-2 gap-1">
              <Skeleton className="h-4 w-11/12 rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

function DetailHeaderSkeleton({
  artworkClassName,
}: {
  artworkClassName: string
}) {
  return (
    <View className="mb-6">
      <View className="flex-row gap-4">
        <Skeleton className={artworkClassName} />
        <View className="flex-1 justify-center gap-2">
          <Skeleton className="h-7 w-4/5 rounded-md" />
          <Skeleton className="h-4 w-3/5 rounded-md" />
          <Skeleton className="h-4 w-2/5 rounded-md" />
        </View>
      </View>
    </View>
  )
}

function AlbumDetailSkeleton() {
  return (
    <View className="px-4 pt-6">
      <DetailHeaderSkeleton artworkClassName="h-36 w-36 rounded-lg" />
      <PlaybackActionsSkeleton />
      <TrackListSkeleton itemCount={9} showCover={false} showRank />
    </View>
  )
}

function PlaylistDetailSkeleton() {
  return (
    <View className="px-4 pt-6">
      <DetailHeaderSkeleton artworkClassName="h-36 w-36 rounded-lg" />
      <PlaybackActionsSkeleton />
      <TrackListSkeleton itemCount={9} />
    </View>
  )
}

function ArtistDetailSkeleton() {
  return (
    <View>
      <Skeleton className="h-80 w-full rounded-none" />
      <View className="px-4 pt-4">
        <SectionHeaderSkeleton />
        <TrackListSkeleton itemCount={4} />
      </View>
    </View>
  )
}

function PlaylistFormSkeleton() {
  return (
    <View className="px-4 pt-4">
      <View className="mb-5 gap-4">
        <View className="gap-2">
          <View className="flex-row justify-between">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </View>
          <Skeleton className="h-12 w-full rounded-xl" />
        </View>
        <View className="gap-2">
          <View className="flex-row justify-between">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </View>
          <Skeleton className="h-24 w-full rounded-xl" />
        </View>
        <View className="flex-row items-center justify-between">
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </View>
      </View>
      <TrackListSkeleton itemCount={7} />
    </View>
  )
}

export const LibrarySkeleton: React.FC<LibrarySkeletonProps> = ({
  type,
  itemCount = 8,
  className,
}) => {
  return (
    <View className={className}>
      {type === "tracks" ? (
        <TrackListSkeleton itemCount={itemCount} />
      ) : type === "tracks-compact" ? (
        <TrackListSkeleton itemCount={itemCount} showCover={false} showRank />
      ) : type === "albums" ? (
        <AlbumGridSkeleton itemCount={itemCount} />
      ) : type === "artists" ? (
        <ArtistGridSkeleton itemCount={itemCount} />
      ) : type === "genres" ? (
        <GenreGridSkeleton itemCount={itemCount} />
      ) : type === "home" ? (
        <HomeSkeleton />
      ) : type === "search-results" ? (
        <SearchResultsSkeleton />
      ) : type === "genre-overview" ? (
        <GenreOverviewSkeleton />
      ) : type === "album-detail" ? (
        <AlbumDetailSkeleton />
      ) : type === "artist-detail" ? (
        <ArtistDetailSkeleton />
      ) : type === "playlist-detail" ? (
        <PlaylistDetailSkeleton />
      ) : type === "playlist-form" ? (
        <PlaylistFormSkeleton />
      ) : null}
    </View>
  )
}
