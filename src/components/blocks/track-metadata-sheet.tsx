import { BottomSheet, Chip } from "heroui-native"
import * as React from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Image } from "expo-image"

import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import { ICON_SIZES } from "@/lib/layout"
import { useThemeColors } from "@/core/theme/use-theme-colors"
import { getPreferenceState } from "@/core/preferences/store"
import type { SplitMultipleValueConfig } from "@/core/preferences/types"
import { db } from "@/core/db"
import { tracks as tracksTable } from "@/core/db/schema"
import { eq } from "drizzle-orm"
import { useQuery } from "@tanstack/react-query"
import { TRACKS_KEY } from "@/domains/library/query-keys"
import type { PlayerTrack } from "@/playback/types"
import { formatArtistsForDisplay, splitArtistsValue } from "@/domains/tracks/split-engine"

interface QuickFact {
  label: string
  value: string
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`
}

async function fetchTrackRow(id: string) {
  return db.query.tracks.findFirst({
    where: eq(tracksTable.id, id),
    with: { album: true, artist: true },
  })
}

export const TrackMetadataSheet: React.FC<{
  track: PlayerTrack
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}> = ({ track, isOpen, onOpenChange }) => {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const splitConfig: SplitMultipleValueConfig = getPreferenceState().splitMultipleValueConfig

  const { data: row } = useQuery({
    queryKey: [TRACKS_KEY, "metadata", track.id],
    enabled: isOpen && !track.isExternal,
    queryFn: () => fetchTrackRow(track.id),
  })

  const artistName =
    formatArtistsForDisplay(
      row?.rawArtist || "",
      splitArtistsValue(row?.rawArtist || "", splitConfig),
      splitConfig.artistSplitMode
    ) ||
    track.artist ||
    t("library.unknownArtist")

  const quickFacts = React.useMemo<QuickFact[]>(() => {
    const facts: QuickFact[] = [
      { label: t("track.metadata.duration"), value: formatDuration(track.duration ?? 0) },
    ]
    if (row?.year) facts.push({ label: t("track.metadata.year"), value: String(row.year) })
    if (row?.audioCodec)
      facts.push({ label: t("track.metadata.codec"), value: row.audioCodec.toUpperCase() })
    if (row?.audioFormat)
      facts.push({ label: t("track.metadata.format"), value: row.audioFormat.toUpperCase() })
    if (row?.audioBitrate)
      facts.push({ label: t("track.metadata.quality"), value: `${Math.round(row.audioBitrate / 1000)} kbps` })
    if ((row?.playCount ?? 0) > 0)
      facts.push({ label: t("track.metadata.playCount"), value: String(row?.playCount ?? 0) })
    return facts
  }, [row, track.duration, t])

  return (
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
                <Image source={{ uri: track.image }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
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
              <Text className="text-sm text-muted">{artistName}</Text>
              <Text className="text-xs text-muted/90" numberOfLines={1}>
                {row?.album?.title || track.album || t("library.unknownAlbum")}
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
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  )
}
