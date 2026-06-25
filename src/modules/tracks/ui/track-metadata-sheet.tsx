import type { Track } from "@/modules/player/store"
import { BottomSheet, Chip } from "heroui-native"
import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Image } from "expo-image"
import { useThemeColors } from "@/modules/ui/theme"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import { ICON_SIZES } from "@/constants/icon-sizes"
import { ArtistPickerSheet } from "@/components/blocks/artist-picker-sheet"
import { buildArtistPickerItems } from "@/modules/library/artist-picker-utils"
import { ValueNavigationSheet } from "@/components/blocks/value-navigation-sheet"
import { useTrack } from "@/modules/tracks/queries"
import { useSettingsStore } from "@/modules/settings/store"
import { resolvePlayableFileUri } from "@/utils/file-path"
import { openDeviceFile } from "@/modules/device/file-viewer"
import { deriveTrackMetadata, buildMetadataLayoutItems } from "./track-metadata/metadata-derivation"
import { MetadataGrid } from "./track-metadata/metadata-grid"
import { useTrackMetadataNavigation } from "./track-metadata/use-track-metadata-navigation"

interface TrackMetadataSheetProps {
  track: Track
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCloseParent: () => void
}

export const TrackMetadataSheet: React.FC<TrackMetadataSheetProps> = ({
  track,
  isOpen,
  onOpenChange,
  onCloseParent,
}) => {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const trackUri = track.uri ?? ""

  const { data: resolvedFileUri = null } = useQuery({
    queryKey: ["tracks", "resolved-file-uri", track.id, trackUri] as const,
    enabled: trackUri.length > 0,
    queryFn: async () => await resolvePlayableFileUri(trackUri),
  })

  const { data: fullTrackData } = useTrack(track.id)
  const splitMultipleValueConfig = useSettingsStore((state) => state.splitMultipleValueConfig)

  const handleCloseAll = () => {
    onOpenChange(false)
    onCloseParent()
  }

  const {
    artistSelectionItems,
    genreSelectionValues,
    isArtistSelectionOpen,
    isGenreSelectionOpen,
    setIsArtistSelectionOpen,
    setIsGenreSelectionOpen,
    handleOpenArtist,
    handleOpenAlbum,
    handleOpenGenre,
    handleOpenArtistSelection,
    handleOpenGenreSelection,
  } = useTrackMetadataNavigation({
    trackAlbumId: track.albumId,
    fullTrackData,
    buildArtistPickerItems: buildArtistPickerItems as any,
    trackCountLabel: (count) => t("library.count.track", { count }),
    onSheetClose: handleCloseAll,
  })

  const handleOpenFile = async () => {
    if (!track.uri) return
    const opened = await openDeviceFile({
      uri: track.uri,
      trackId: track.id,
    })
    if (opened) {
      handleCloseAll()
    }
  }

  const { quickFacts, metadataItems } = deriveTrackMetadata({
    t,
    track,
    resolvedFileUri,
    fullTrackData,
    splitMultipleValueConfig,
    onOpenArtistSelection: handleOpenArtistSelection,
    onOpenAlbum: handleOpenAlbum,
    onOpenGenreSelection: handleOpenGenreSelection,
    onOpenFile: handleOpenFile,
  })

  const metadataLayoutItems = buildMetadataLayoutItems(metadataItems)
  const fallbackArtist = track.artist || t("library.unknownArtist")
  const fallbackAlbum = track.album || t("library.unknownAlbum")

  return (
    <>
      <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            snapPoints={["62%", "92%"]}
            enableDynamicSizing={false}
            contentContainerClassName="px-5 pt-2 pb-5"
            backgroundClassName="bg-surface"
          >
            <View className="mb-5 flex-row items-center gap-4">
              <View className="h-18 w-18 overflow-hidden rounded-xl bg-default">
                {track.image ? (
                  <Image
                    source={{ uri: track.image }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center bg-default">
                    <LocalMusicNote04SolidIcon
                      fill="none"
                      width={ICON_SIZES.sheetArtworkFallback}
                      height={ICON_SIZES.sheetArtworkFallback}
                      color={theme.muted}
                    />
                  </View>
                )}
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-xl leading-7 font-bold text-foreground">{track.title}</Text>
                <Text className="text-sm text-muted">{fallbackArtist}</Text>
                <Text className="text-xs text-muted/90" numberOfLines={1}>
                  {fallbackAlbum}
                </Text>
              </View>
            </View>

            <View className="mb-4 flex-row flex-wrap gap-2">
              {quickFacts.map((fact) => (
                <Chip key={fact.label} size="sm" variant="secondary" color="default">
                  <Chip.Label className="text-xs">{`${fact.label}: ${fact.value}`}</Chip.Label>
                </Chip>
              ))}
            </View>

            <MetadataGrid
              layoutItems={metadataLayoutItems}
              onSheetClose={() => onOpenChange(false)}
            />
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <ArtistPickerSheet
        isOpen={isArtistSelectionOpen}
        title={t("track.metadata.artist")}
        items={artistSelectionItems}
        onOpenChange={setIsArtistSelectionOpen}
        onSelectValue={handleOpenArtist}
      />

      <ValueNavigationSheet
        isOpen={isGenreSelectionOpen}
        title={t("track.metadata.genre")}
        values={genreSelectionValues}
        onOpenChange={setIsGenreSelectionOpen}
        onSelectValue={handleOpenGenre}
      />
    </>
  )
}
