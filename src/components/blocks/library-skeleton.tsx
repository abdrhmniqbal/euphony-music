import * as React from "react"
import { Animated, Dimensions, View } from "react-native"
import { useUniwind } from "uniwind"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

interface LibrarySkeletonProps {
  type: "tracks" | "albums" | "artists"
  itemCount?: number
}

function ShimmerView({ className }: { className?: string }) {
  const shimmerAnim = React.useMemo(() => new Animated.Value(0), [])
  const { theme } = useUniwind()
  const isDark = theme === "dark"

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [shimmerAnim])

  const translateX = React.useMemo(
    () =>
      shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
      }),
    [shimmerAnim]
  )

  return (
    <View className={`overflow-hidden ${className}`}>
      <Animated.View
        className="absolute inset-0"
        style={{
          transform: [{ translateX }],
          backgroundColor: isDark
            ? "rgba(255,255,255,0.05)"
            : "rgba(0,0,0,0.05)",
        }}
      />
    </View>
  )
}

function TrackSkeleton() {
  return (
    <View className="flex-row items-center gap-3 py-2.5">
      <View className="h-14 w-14 rounded-lg bg-default">
        <ShimmerView className="h-full w-full" />
      </View>
      <View className="flex-1 justify-center gap-0.5">
        <View className="h-4 w-3/4 rounded bg-default">
          <ShimmerView className="h-full w-full" />
        </View>
        <View className="h-3 w-1/2 rounded bg-default">
          <ShimmerView className="h-full w-full" />
        </View>
      </View>
    </View>
  )
}

function AlbumSkeleton() {
  const GAP = 12
  const NUM_COLUMNS = 2
  const HORIZONTAL_PADDING = 32
  const ITEM_WIDTH =
    (SCREEN_WIDTH - HORIZONTAL_PADDING - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS

  return (
    <View style={{ width: ITEM_WIDTH }}>
      <View className="aspect-square w-full rounded-md bg-default">
        <ShimmerView className="h-full w-full" />
      </View>
      <View className="mt-1">
        <View className="h-4 w-full rounded bg-default">
          <ShimmerView className="h-full w-full" />
        </View>
        <View className="mt-0.5 h-3 w-2/3 rounded bg-default">
          <ShimmerView className="h-full w-full" />
        </View>
      </View>
    </View>
  )
}

function ArtistSkeleton() {
  const GAP = 12
  const NUM_COLUMNS = 3
  const HORIZONTAL_PADDING = 28
  const ITEM_WIDTH =
    (SCREEN_WIDTH - HORIZONTAL_PADDING - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS

  return (
    <View style={{ width: ITEM_WIDTH }} className="items-center">
      <View className="aspect-square w-full rounded-full bg-default">
        <ShimmerView className="h-full w-full" />
      </View>
      <View className="mt-1 items-center">
        <View className="h-4 w-full rounded bg-default">
          <ShimmerView className="h-full w-full" />
        </View>
        <View className="mt-0.5 h-3 w-2/3 rounded bg-default">
          <ShimmerView className="h-full w-full" />
        </View>
      </View>
    </View>
  )
}

export const LibrarySkeleton: React.FC<LibrarySkeletonProps> = ({
  type,
  itemCount = 6,
}) => {
  const trackSkeletonKeys = Array.from(
    { length: itemCount },
    (_, index) => `track-skeleton-${index}`
  )

  const renderSkeleton = () => {
    switch (type) {
      case "tracks":
        return (
          <View style={{ gap: 8 }}>
            {trackSkeletonKeys.map((key) => (
              <TrackSkeleton key={key} />
            ))}
          </View>
        )
      case "albums": {
        const GAP = 12
        const NUM_COLUMNS = 2
        const rows = []
        for (let i = 0; i < itemCount; i += NUM_COLUMNS) {
          const itemsInRow = Math.min(NUM_COLUMNS, itemCount - i)
          const albumRowKeys = Array.from(
            { length: itemsInRow },
            (_, offset) => `album-skeleton-${i + offset}`
          )
          rows.push(
            <View
              key={`album-row-${i}`}
              className="flex-row"
              style={{ gap: GAP }}
            >
              {albumRowKeys.map((key) => (
                <AlbumSkeleton key={key} />
              ))}
            </View>
          )
        }
        return <View style={{ gap: GAP }}>{rows}</View>
      }
      case "artists": {
        const GAP = 12
        const NUM_COLUMNS = 3
        const rows = []
        for (let i = 0; i < itemCount; i += NUM_COLUMNS) {
          const itemsInRow = Math.min(NUM_COLUMNS, itemCount - i)
          const artistRowKeys = Array.from(
            { length: itemsInRow },
            (_, offset) => `artist-skeleton-${i + offset}`
          )
          rows.push(
            <View
              key={`artist-row-${i}`}
              className="flex-row"
              style={{ gap: GAP }}
            >
              {artistRowKeys.map((key) => (
                <ArtistSkeleton key={key} />
              ))}
            </View>
          )
        }
        return <View style={{ gap: GAP }}>{rows}</View>
      }
    }
  }

  return <View>{renderSkeleton()}</View>
}
