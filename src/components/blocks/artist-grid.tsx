import type { LegendListRenderItemProps } from "@legendapp/list/react-native"
import { LegendList } from "@legendapp/list/react-native"
import * as React from "react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import {
  MediaItem,
  MediaItemContent,
  MediaItemDescription,
  MediaItemImage,
  MediaItemTitle,
} from "@/components/ui/media-item"
import { EmptyState } from "@/components/ui/empty-state"
import { ICON_SIZES } from "@/lib/layout"
import { useThemeColors } from "@/core/theme/use-theme-colors"

export interface Artist {
  id: string
  name: string
  trackCount: number
  image?: string
}

interface ArtistGridProps {
  data: Artist[]
  onArtistPress?: (artist: Artist) => void
}

export function ArtistGrid({ data, onArtistPress }: ArtistGridProps) {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const renderItem = useCallback(
    ({ item, index }: LegendListRenderItemProps<Artist>) => (
      <View
        key={item.id}
        style={{
          flex: 1 / 3,
          paddingRight: index % 3 === 0 ? 8 : index % 3 === 1 ? 4 : 0,
          paddingLeft: index % 3 === 0 ? 0 : index % 3 === 1 ? 4 : 8,
          marginBottom: 16,
        }}
      >
        <MediaItem
          variant="grid"
          className="w-full"
          onPress={() => onArtistPress?.(item)}
          onLongPress={() => {
            setSelectedArtist(item)
            setIsSheetOpen(true)
          }}
        >
          <MediaItemImage
            icon={
              <LocalUserSolidIcon
                fill="none"
                width={ICON_SIZES.gridFallback}
                height={ICON_SIZES.gridFallback}
                color={theme.muted}
              />
            }
            image={item.image}
            className="aspect-square w-full rounded-full bg-default"
          />
          <MediaItemContent className="mt-1 items-center">
            <MediaItemTitle className="text-center text-sm" numberOfLines={1}>
              {item.name}
            </MediaItemTitle>
            <MediaItemDescription className="text-center">
              {t("library.count.track", { count: item.trackCount })}
            </MediaItemDescription>
          </MediaItemContent>
        </MediaItem>
      </View>
    ),
    [onArtistPress, t, theme.muted]
  )

  return (
    <>
      <LegendList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={
              <LocalUserSolidIcon fill="none" width={48} height={48} color={theme.muted} />
            }
            title={t("library.empty.artistsTitle")}
            message={t("library.empty.artistsMessage")}
          />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 200 }}
        style={{ flex: 1, minHeight: 1 }}
        recycleItems
        estimatedItemSize={160}
      />
      <CollectionActionSheet
        visible={isSheetOpen && Boolean(selectedArtist)}
        onOpenChange={(open) => {
          if (!open) {
            setIsSheetOpen(false)
          }
        }}
        type="artist"
        id={selectedArtist?.id ?? ""}
        name={selectedArtist?.name ?? ""}
        subtitle={
          selectedArtist ? t("library.count.track", { count: selectedArtist.trackCount }) : undefined
        }
        image={selectedArtist?.image}
        trackCount={selectedArtist?.trackCount ?? 0}
      />
    </>
  )
}

export default ArtistGrid
