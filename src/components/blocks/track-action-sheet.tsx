/**
 * Purpose: Displays track actions and metadata, including clickable multi-value artist and genre navigation.
 * Caller: Track list and playlist screens opening track context actions.
 * Dependencies: HeroUI Native sheets, shared artist picker, track queries, playlist/favorites services, split settings state, and router navigation.
 * Main Functions: TrackActionSheet()
 * Side Effects: Opens dialogs/sheets, queues playback actions, and navigates to artist/album/genre routes.
 */

import type { Track } from "@/modules/player/store"
import { Image } from "expo-image"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { BottomSheet, Button, Card, Chip } from "heroui-native"
import * as React from "react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { DeleteTrackDialog } from "@/components/blocks/delete-track-dialog"
import {
  ArtistPickerSheet,
  type ArtistPickerSheetItem,
} from "@/components/blocks/artist-picker-sheet"
import { buildArtistPickerItems } from "@/components/blocks/artist-picker.utils"
import { PlaylistPickerSheet } from "@/components/blocks/playlist-picker-sheet"
import { ValueNavigationSheet } from "@/components/blocks/value-navigation-sheet"
import LocalAddIcon from "@/components/icons/local/add"
import LocalCancelIcon from "@/components/icons/local/cancel"
import LocalDeleteSolidIcon from "@/components/icons/local/delete-solid"
import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import LocalNextSolidIcon from "@/components/icons/local/next-solid"
import LocalPlaySolidIcon from "@/components/icons/local/play-solid"
import LocalPlaylistSolidIcon from "@/components/icons/local/playlist-solid"
import LocalSlidersVerticalIcon from "@/components/icons/local/sliders-vertical"
import LocalUserIcon from "@/components/icons/local/user"
import LocalVynilSolidIcon from "@/components/icons/local/vynil-solid"
import { MarqueeText } from "@/components/ui/marquee-text"
import { ICON_SIZES } from "@/constants/icon-sizes"
import { openDeviceFile } from "@/modules/device/file-viewer"
import { resolveAlbumTransitionId } from "@/modules/artists/artist-transition"
import { useToggleFavorite } from "@/modules/favorites/mutations"
import { useIsFavorite } from "@/modules/favorites/queries"
import { playTrack } from "@/modules/player/service"
import { addToQueue, queueTrackNext } from "@/modules/player/queue"
import { useRemoveTrackFromPlaylist } from "@/modules/playlist/mutations"
import { usePlaylistPickerSelection } from "@/modules/playlist/picker-selection.hook"
import { showAppToast } from "@/modules/ui/toast"
import {
  formatQualityLabel,
  normalizeCodecLabel,
  resolveAudioFormat,
} from "@/modules/tracks/track-metadata.utils"
import { useTrack } from "@/modules/tracks/queries"
import { useThemeColors } from "@/modules/ui/theme"
import { useSettingsStore } from "@/modules/settings/store"
import { splitArtistsValue, splitGenresValue } from "@/modules/settings/split-multiple-values"
import { resolvePlayableFileUri } from "@/utils/file-path"
import { formatDuration } from "@/utils/format"

interface MetadataValueSegment {
  value: string
  onPress?: () => void
}

interface TrackActionSheetProps {
  track: Track | null
  isOpen: boolean
  onClose: () => void
  tracks?: Track[]
  playlistId?: string
  onAddToPlaylist?: (track: Track) => void
}

interface MenuRowProps {
  icon: React.ReactNode
  label: string
  onPress: () => void
  colorClassName?: string
}

function MenuRow({ icon, label, onPress, colorClassName = "text-foreground" }: MenuRowProps) {
  return (
    <Button variant="ghost" onPress={onPress} className="h-13 w-full justify-start px-0">
      <View className="flex-row items-center gap-4 px-1">
        <View className="w-6 items-center justify-center">{icon}</View>
        <Text className={`text-base font-medium ${colorClassName}`}>{label}</Text>
      </View>
    </Button>
  )
}

export const TrackActionSheet: React.FC<TrackActionSheetProps> = ({
  track,
  isOpen,
  onClose,
  tracks,
  playlistId,
  onAddToPlaylist,
}) => {
  const router = useRouter()

  const { t } = useTranslation()
  const theme = useThemeColors()
  const toggleFavoriteMutation = useToggleFavorite()
  const removeTrackFromPlaylistMutation = useRemoveTrackFromPlaylist()
  const [isPlaylistPickerOpen, setIsPlaylistPickerOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({})
  const favoriteTrackId = track?.id || ""
  const { data: isFavoriteData = track?.isFavorite ?? false } = useIsFavorite(
    "track",
    favoriteTrackId
  )
  const isFavorite = track ? (favoriteOverrides[track.id] ?? Boolean(isFavoriteData)) : false
  const trackUri = track?.uri ?? ""
  const { data: resolvedFileUri = null } = useQuery({
    queryKey: ["tracks", "resolved-file-uri", track?.id, trackUri] as const,
    enabled: trackUri.length > 0,
    queryFn: async () => await resolvePlayableFileUri(trackUri),
  })
  const { data: fullTrackData } = useTrack(track?.id ?? "")
  const splitMultipleValueConfig = useSettingsStore((state) => state.splitMultipleValueConfig)
  const [artistSelectionItems, setArtistSelectionItems] = useState<ArtistPickerSheetItem[]>([])
  const [genreSelectionValues, setGenreSelectionValues] = useState<string[]>([])
  const [isArtistSelectionOpen, setIsArtistSelectionOpen] = useState(false)
  const [isGenreSelectionOpen, setIsGenreSelectionOpen] = useState(false)
  const [isMetadataSheetOpen, setIsMetadataSheetOpen] = useState(false)

  const handlePlay = async () => {
    if (track) {
      playTrack(track, tracks)
      onClose()
    }
  }

  const handleToggleFavorite = () => {
    if (track) {
      const newState = !isFavorite
      setFavoriteOverrides((prev) => ({ ...prev, [track.id]: newState }))
      void toggleFavoriteMutation.mutateAsync({
        type: "track",
        itemId: track.id,
        isCurrentlyFavorite: isFavorite,
        name: track.title,
        subtitle: track.artist,
        image: track.image,
      })
    }
  }

  const handlePlayNext = async () => {
    if (track) {
      await queueTrackNext(track)
      onClose()
    }
  }

  const handleAddToQueue = async () => {
    if (track) {
      await addToQueue(track)
      onClose()
    }
  }

  const handleAddToPlaylist = () => {
    if (!track) {
      return
    }

    if (onAddToPlaylist) {
      onAddToPlaylist(track)
      onClose()
      return
    }

    setIsPlaylistPickerOpen(true)
  }

  const handleRemoveFromPlaylist = async () => {
    if (!track || !playlistId) {
      return
    }

    await removeTrackFromPlaylistMutation.mutateAsync({
      playlistId,
      trackId: track.id,
    })
    onClose()
  }

  const handleOpenDeleteDialog = () => {
    if (!track) {
      return
    }

    setIsPlaylistPickerOpen(false)
    setIsDeleteDialogOpen(true)
    onClose()
  }

  const showPlaylistToast = (title: string, description?: string) => {
    showAppToast(title, description)
  }

  const { isSelecting, handleSelectPlaylist } = usePlaylistPickerSelection({
    trackId: track?.id,
    onSelectionApplied: () => {
      setIsPlaylistPickerOpen(false)
      onClose()
    },
    showPlaylistToast,
  })

  const handleCreatePlaylist = () => {
    setIsPlaylistPickerOpen(false)
    onClose()
    router.push("/playlist/form")
  }

  const handleOpenArtist = (artistName: string) => {
    const normalizedArtistName = artistName.trim()
    if (!normalizedArtistName) {
      return
    }

    setIsArtistSelectionOpen(false)
    router.push({
      pathname: "/artist/[name]",
      params: { name: normalizedArtistName },
    })
    onClose()
  }

  const handleOpenAlbum = (albumName: string) => {
    const normalizedAlbumName = albumName.trim()
    if (!normalizedAlbumName) {
      return
    }

    router.push({
      pathname: "/album/[name]",
      params: {
        name: normalizedAlbumName,
        transitionId: resolveAlbumTransitionId({
          id: track?.albumId,
          title: normalizedAlbumName,
        }),
      },
    })
    onClose()
  }

  const handleOpenGenre = (genreName: string) => {
    const normalizedGenreName = genreName.trim()
    if (!normalizedGenreName) {
      return
    }

    setIsGenreSelectionOpen(false)
    router.push({
      pathname: "/genre/[name]",
      params: { name: normalizedGenreName },
    })
    onClose()
  }

  const handleOpenArtistSelection = (values: string[]) => {
    const normalized = dedupeValues(
      values.map((value) => value.trim()).filter((value) => value.length > 0)
    )
    if (normalized.length === 0) {
      return
    }

    if (normalized.length === 1) {
      handleOpenArtist(normalized[0] || "")
      return
    }

    const richArtistItems = buildArtistPickerItems(
      {
        artwork: fullTrackData?.artwork,
        albumArtwork: fullTrackData?.album?.artwork,
        artist: fullTrackData?.artist,
        featuredArtists: fullTrackData?.featuredArtists,
      },
      normalized,
      (count) => t("library.count.track", { count })
    )

    setArtistSelectionItems(
      richArtistItems.length > 0 ? richArtistItems : normalized.map((value) => ({ value }))
    )
    setIsArtistSelectionOpen(true)
  }

  const handleOpenGenreSelection = (values: string[]) => {
    const normalized = dedupeValues(
      values.map((value) => value.trim()).filter((value) => value.length > 0)
    )
    if (normalized.length === 0) {
      return
    }

    if (normalized.length === 1) {
      handleOpenGenre(normalized[0] || "")
      return
    }

    setGenreSelectionValues(normalized)
    setIsGenreSelectionOpen(true)
  }
  const handleOpenFile = async () => {
    if (!track?.uri) {
      return
    }

    const opened = await openDeviceFile({
      uri: track.uri,
      trackId: track.id,
    })

    if (opened) {
      onClose()
    }
  }

  if (!track) {
    return (
      <BottomSheet isOpen={false} onOpenChange={() => {}}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content />
        </BottomSheet.Portal>
      </BottomSheet>
    )
  }

  const unknownValue = t("common.unknown")
  const fallbackArtist = track.artist || t("library.unknownArtist")
  const fallbackAlbum = track.album || t("library.unknownAlbum")

  const fileName = (() => {
    if (track.filename) {
      return track.filename
    }

    const uriPart = track.uri.split("/").pop() || ""
    if (!uriPart) {
      return t("library.unknownFile")
    }

    try {
      return decodeURIComponent(uriPart)
    } catch {
      return uriPart
    }
  })()
  const filePath = (() => {
    if (!track.uri) {
      return t("library.unknownFile")
    }

    const uri = resolvedFileUri || track.uri
    const normalizedPath = uri.startsWith("file://") ? uri.slice("file://".length) : uri

    try {
      return decodeURIComponent(normalizedPath)
    } catch {
      return normalizedPath
    }
  })()
  const lastPlayed = (() => {
    if (!track.lastPlayedAt || !Number.isFinite(track.lastPlayedAt)) {
      return t("track.never")
    }

    const date = new Date(track.lastPlayedAt)
    if (Number.isNaN(date.getTime())) {
      return t("track.never")
    }

    return date.toLocaleString()
  })()
  const codecLabel = normalizeCodecLabel(track.audioCodec)
  const formatLabel = resolveAudioFormat(track.audioFormat, fileName, codecLabel)
  const qualityLabel = formatQualityLabel(track.audioSampleRate, track.audioBitrate)
  const durationLabel = formatDuration(track.duration || 0)
  const splitCommaValues = (value: string | undefined) =>
    (value || "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  function dedupeValues(values: string[]) {
    const seen = new Set<string>()
    return values.filter((value) => {
      const key = value.toLowerCase()
      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
  }
  const artistNames = (() => {
    const relationNames = [
      fullTrackData?.artist?.name?.trim(),
      ...(fullTrackData?.featuredArtists?.map((entry) => entry.artist?.name?.trim()) ?? []),
    ].filter((value): value is string => Boolean(value))

    if (relationNames.length > 0) {
      return dedupeValues(relationNames)
    }

    const fallbackNames = splitArtistsValue(track.artist, splitMultipleValueConfig)
    return fallbackNames.length > 0 ? dedupeValues(fallbackNames) : []
  })()
  const albumNames = (() => {
    const relationAlbumName = fullTrackData?.album?.title?.trim()
    if (relationAlbumName) {
      return [relationAlbumName]
    }

    const fallbackAlbumName = track.album?.trim()
    return fallbackAlbumName ? [fallbackAlbumName] : []
  })()
  const genreNames = (() => {
    const names =
      fullTrackData?.genres
        ?.map((entry) => entry.genre?.name?.trim())
        .filter((value): value is string => Boolean(value))
        .filter((value, index, all) => all.indexOf(value) === index) ?? []

    if (names.length > 0) {
      return names
    }

    const fallbackGenreNames = splitGenresValue(track.genre, splitMultipleValueConfig)
    if (fallbackGenreNames.length > 0) {
      return dedupeValues(fallbackGenreNames)
    }

    return []
  })()
  const quickFacts = [
    { label: t("track.metadata.quality"), value: qualityLabel },
    { label: t("track.metadata.codec"), value: codecLabel || unknownValue },
    { label: t("track.metadata.format"), value: formatLabel },
  ]

  const metadataItems: Array<{
    label: string
    segments: MetadataValueSegment[]
    fullWidth?: boolean
  }> = [
    {
      label: t("track.metadata.artist"),
      segments:
        artistNames.length > 0
          ? splitMultipleValueConfig.artistSplitMode === "original" && track.artist?.trim()
            ? [
                {
                  value: track.artist.trim(),
                  onPress: () => handleOpenArtistSelection(artistNames),
                },
              ]
            : artistNames.map((name) => ({
                value: name,
                onPress: () => handleOpenArtistSelection(artistNames),
              }))
          : [{ value: t("library.unknownArtist") }],
      fullWidth:
        (artistNames.length > 0 ? artistNames.join(", ") : t("library.unknownArtist")).length > 24,
    },
    {
      label: t("track.metadata.album"),
      segments:
        albumNames.length > 0
          ? albumNames.map((name) => ({
              value: name,
              onPress: () => handleOpenAlbum(name),
            }))
          : [{ value: t("library.unknownAlbum") }],
      fullWidth:
        (albumNames.length > 0 ? albumNames.join(", ") : t("library.unknownAlbum")).length > 24,
    },
    {
      label: t("track.metadata.genre"),
      segments:
        genreNames.length > 0
          ? genreNames.map((genreName) => ({
              value: genreName,
              onPress: () => handleOpenGenreSelection(genreNames),
            }))
          : [{ value: unknownValue }],
      fullWidth: (genreNames.length > 0 ? genreNames.join(", ") : unknownValue).length > 24,
    },
    {
      label: t("track.metadata.year"),
      segments: [{ value: track.year ? String(track.year) : unknownValue }],
    },
    {
      label: t("track.metadata.trackDisc"),
      segments: [
        {
          value:
            track.trackNumber || track.discNumber
              ? `${track.trackNumber ?? "?"} / ${track.discNumber ?? "?"}`
              : unknownValue,
        },
      ],
    },
    {
      label: t("track.metadata.duration"),
      segments: [{ value: durationLabel }],
    },
    {
      label: t("track.metadata.playCount"),
      segments: [{ value: String(track.playCount || 0) }],
    },
    {
      label: t("track.metadata.lastPlayed"),
      segments: [{ value: lastPlayed }],
      fullWidth: true,
    },
    {
      label: t("track.metadata.file"),
      segments: [
        {
          value: filePath,
          onPress: track.uri
            ? () => {
                void handleOpenFile()
              }
            : undefined,
        },
      ],
      fullWidth: true,
    },
  ]
  const metadataLayoutItems = metadataItems.map((item) => ({
    ...item,
    displayValue: item.segments.map((segment) => segment.value).join(", "),
    isFullWidth: Boolean(item.fullWidth),
  }))

  let pendingHalfWidthIndex: number | null = null
  for (let i = 0; i < metadataLayoutItems.length; i += 1) {
    const currentItem = metadataLayoutItems[i]
    if (!currentItem) {
      continue
    }

    if (currentItem.isFullWidth) {
      pendingHalfWidthIndex = null
      continue
    }

    if (pendingHalfWidthIndex !== null) {
      pendingHalfWidthIndex = null
      continue
    }

    const nextItem = metadataLayoutItems[i + 1]
    const nextCanPairInSameRow = Boolean(nextItem && !nextItem.isFullWidth)

    if (!nextCanPairInSameRow) {
      currentItem.isFullWidth = true
      pendingHalfWidthIndex = null
      continue
    }

    pendingHalfWidthIndex = i
  }

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (open) {
            return
          }

          setIsPlaylistPickerOpen(false)
          onClose()
        }}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            snapPoints={["70%"]}
            enableDynamicSizing={true}
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
                    <LocalMusicNoteSolidIcon
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

            <View className="gap-1">
              <MenuRow
                icon={<LocalPlaySolidIcon fill="none" width={22} height={22} color={theme.foreground} />}
                label={t("common.play")}
                onPress={handlePlay}
              />
              <MenuRow
                icon={
                  isFavorite ? (
                    <LocalFavouriteSolidIcon fill="none" width={22} height={22} color="#ef4444" />
                  ) : (
                    <LocalFavouriteIcon fill="none" width={22} height={22} color={theme.foreground} />
                  )
                }
                label={isFavorite ? t("track.removeFromFavorites") : t("track.addToFavorites")}
                onPress={handleToggleFavorite}
              />
              <MenuRow
                icon={<LocalAddIcon fill="none" width={22} height={22} color={theme.foreground} />}
                label={t("track.addToQueue")}
                onPress={handleAddToQueue}
              />
              <MenuRow
                icon={<LocalNextSolidIcon fill="none" width={22} height={22} color={theme.foreground} />}
                label={t("track.playNext")}
                onPress={handlePlayNext}
              />
              <MenuRow
                icon={<LocalPlaylistSolidIcon fill="none" width={22} height={22} color={theme.foreground} />}
                label={t("track.addToPlaylist")}
                onPress={handleAddToPlaylist}
              />
              {playlistId ? (
                <MenuRow
                  icon={<LocalCancelIcon fill="none" width={22} height={22} color={theme.foreground} />}
                  label={t("track.removeFromPlaylist")}
                  onPress={() => {
                    void handleRemoveFromPlaylist()
                  }}
                />
              ) : null}
              <MenuRow
                icon={<LocalUserIcon fill="none" width={22} height={22} color={theme.foreground} />}
                label={t("player.menu.goToArtist")}
                onPress={() => handleOpenArtistSelection(artistNames)}
              />
              <MenuRow
                icon={<LocalVynilSolidIcon fill="none" width={22} height={22} color={theme.foreground} />}
                label={t("player.menu.goToAlbum")}
                onPress={() => {
                  if (albumNames.length > 0 && albumNames[0]) {
                    handleOpenAlbum(albumNames[0])
                  }
                }}
              />
              <MenuRow
                icon={<LocalSlidersVerticalIcon fill="none" width={22} height={22} color={theme.foreground} />}
                label={t("track.viewMetadata")}
                onPress={() => setIsMetadataSheetOpen(true)}
              />
              <MenuRow
                icon={<LocalDeleteSolidIcon fill="none" width={22} height={22} color="red" />}
                label={t("track.deleteFromDevice")}
                onPress={handleOpenDeleteDialog}
                colorClassName="text-danger"
              />
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <BottomSheet
        isOpen={isMetadataSheetOpen}
        onOpenChange={setIsMetadataSheetOpen}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            snapPoints={["62%", "92%"]}
            enableDynamicSizing={false}
            contentContainerClassName="px-5 pt-2 pb-5"
            backgroundClassName="bg-surface"
          >
            <View className="mb-5 flex-row items-center gap-4">
              <Text className="text-xl font-bold text-foreground">{t("track.viewMetadata")}</Text>
            </View>

            <View className="mb-3 flex-row flex-wrap gap-2">
              {quickFacts.map((fact) => (
                <Chip key={fact.label} size="sm" variant="secondary" color="default">
                  <Chip.Label className="text-xs">{`${fact.label}: ${fact.value}`}</Chip.Label>
                </Chip>
              ))}
            </View>

            <ScrollView className="flex-1">
              <View className="flex-row flex-wrap gap-2">
                {metadataLayoutItems.map((item) => {
                  const containerClassName = item.isFullWidth ? "w-full" : "w-[48.5%]"
                  const hasNavigableValues = item.segments.some((segment) =>
                    Boolean(segment.onPress)
                  )
                  const navigableTextStyle = hasNavigableValues
                    ? {
                        textDecorationLine: "underline" as const,
                        textDecorationStyle: "dotted" as const,
                      }
                    : undefined

                  const content = (
                    <Card className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                      <Text className="mb-1 text-xs font-medium text-muted uppercase">
                        {item.label}
                      </Text>
                      {hasNavigableValues ? (
                        <Text className="text-sm leading-5 text-foreground" numberOfLines={1}>
                          {item.segments.map((segment, segmentIndex) => (
                            <React.Fragment
                              key={`${item.label}-${segment.value}-${segment.onPress ? "link" : "text"}`}
                            >
                              {segment.onPress ? (
                                <Text
                                  className="text-sm leading-5 text-foreground"
                                  suppressHighlighting
                                  style={navigableTextStyle}
                                  onPress={() => {
                                    setIsMetadataSheetOpen(false)
                                    segment.onPress?.()
                                  }}
                                >
                                  {segment.value}
                                </Text>
                              ) : (
                                <Text className="text-sm leading-5 text-foreground">
                                  {segment.value}
                                </Text>
                              )}
                              {segmentIndex < item.segments.length - 1 ? (
                                <Text className="text-sm leading-5 text-foreground">{", "}</Text>
                              ) : null}
                            </React.Fragment>
                          ))}
                        </Text>
                      ) : (
                        <MarqueeText
                          text={item.displayValue}
                          className="text-sm leading-5 text-foreground"
                        />
                      )}
                    </Card>
                  )

                  return (
                    <View key={item.label} className={containerClassName}>
                      {content}
                    </View>
                  )
                })}
              </View>
            </ScrollView>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <DeleteTrackDialog
        track={track}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDeleted={() => {
          setIsPlaylistPickerOpen(false)
          onClose()
        }}
      />

      <PlaylistPickerSheet
        isOpen={isPlaylistPickerOpen}
        onOpenChange={setIsPlaylistPickerOpen}
        trackId={track.id}
        isSelecting={isSelecting}
        onCreatePlaylist={handleCreatePlaylist}
        onSelectPlaylist={(playlist) => {
          void handleSelectPlaylist(playlist)
        }}
      />

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

export default TrackActionSheet
