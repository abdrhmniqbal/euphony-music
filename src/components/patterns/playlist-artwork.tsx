import type { ReactNode } from "react"
import { Image } from "expo-image"
import { View } from "react-native"
import { cn } from "tailwind-variants"

import { ICON_SIZES } from "@/lib/layout"
import { useThemeColors } from "@/core/theme/use-theme-colors"

import LocalPlaylist02SolidIcon from "@/components/icons/local/playlist-02-solid"

export function resolvePlaylistArtworkImages(images?: string[], image?: string) {
  if (images && images.length > 0) {
    return images
  }

  return image ? [image] : undefined
}

function prepareGridImages(images?: string[]): string[] {
  if (!images?.length) {
    return []
  }

  const deduped: string[] = []

  for (const image of images) {
    if (!image || deduped.includes(image)) {
      continue
    }

    deduped.push(image)

    if (deduped.length >= 4) {
      break
    }
  }

  if (deduped.length === 4) {
    return deduped
  }

  const filled: string[] = []

  for (let i = 0; i < 4; i += 1) {
    filled.push(deduped[i % deduped.length])
  }

  return filled
}

interface PlaylistArtworkProps {
  images?: string[]
  className?: string
  fallback?: ReactNode
}

export function PlaylistArtwork({ images, className, fallback }: PlaylistArtworkProps) {
  const theme = useThemeColors()
  const gridImages = prepareGridImages(images)

  if (gridImages.length === 0) {
    return (
      <View className={cn("h-full w-full items-center justify-center bg-surface", className)}>
        {fallback || (
          <LocalPlaylist02SolidIcon
            fill="none"
            width={ICON_SIZES.listFallback}
            height={ICON_SIZES.listFallback}
            color={theme.muted}
          />
        )}
      </View>
    )
  }

  return (
    <View className={cn("h-full w-full flex-row flex-wrap overflow-hidden", className)}>
      {gridImages.map((image, index) => (
        <Image
          key={index}
          source={{ uri: image }}
          style={{ width: "50%", height: "50%" }}
          contentFit="cover"
        />
      ))}
    </View>
  )
}
