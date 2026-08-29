import { BottomSheetScrollView } from "@gorhom/bottom-sheet"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Image } from "expo-image"
import {
  BottomSheet,
  Button,
  PressableFeedback,
  Spinner,
  TextField,
  useThemeColor,
} from "heroui-native"
import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"

import LocalCancel01Icon from "@/components/icons/local/cancel-01"
import LocalSearch01Icon from "@/components/icons/local/search-01"
import LocalTick02Icon from "@/components/icons/local/tick-02"
import { SheetInput } from "@/components/patterns/sheet-input"
import { EmptyState } from "@/components/ui/empty-state"
import { showAppToast } from "@/core/ui/toast"
import {
  searchDeezerArtistCandidates,
  setArtistDeezerArtwork,
  type DeezerArtistCandidate,
} from "@/domains/deezer"
import { ARTISTS_KEY } from "@/domains/library/query-keys"

const ARTWORK_SHEET_SNAP_POINTS = ["72%", "90%"]

interface ArtistArtworkSheetProps {
  isOpen: boolean
  onClose: () => void
  artistId: string
  artistName: string
  currentArtwork?: string
}

export function ArtistArtworkSheet({
  isOpen,
  onClose,
  artistId,
  artistName,
  currentArtwork,
}: ArtistArtworkSheetProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [accent, accentForeground, border, muted] = useThemeColor([
    "accent",
    "accent-foreground",
    "border",
    "muted",
  ])
  const [searchQuery, setSearchQuery] = useState(artistName)
  const [isApplying, setIsApplying] = useState(false)

  const normalizedQuery = searchQuery.trim()

  const { data: candidates = [], isFetching } = useQuery<DeezerArtistCandidate[]>({
    queryKey: ["deezer-artist-search", normalizedQuery],
    enabled: isOpen && normalizedQuery.length > 0,
    queryFn: () => searchDeezerArtistCandidates(normalizedQuery),
    staleTime: 5 * 60 * 1000,
  })

  const handleSelectCandidate = async (candidate: DeezerArtistCandidate) => {
    if (isApplying) return
    setIsApplying(true)
    try {
      await setArtistDeezerArtwork(artistId, candidate.id, candidate.picture_xl)
      await queryClient.invalidateQueries({ queryKey: [ARTISTS_KEY] })
      showAppToast(t("artist.artworkUpdated"))
      onClose()
    } catch {
      showAppToast(t("common.error.generic", { defaultValue: "Failed to update artwork" }))
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay isCloseOnPress />
        <BottomSheet.Content
          index={0}
          snapPoints={ARTWORK_SHEET_SNAP_POINTS}
          enableOverDrag={false}
          enableDynamicSizing={false}
          contentContainerClassName="h-full pt-16 pb-safe-offset-4"
          keyboardBehavior="extend"
          backgroundClassName="bg-surface"
        >
          <View className="absolute top-0 right-0 left-0 z-10 px-5 pt-3">
            <TextField className="w-full">
              <View className="w-full flex-row items-center">
                <SheetInput
                  placeholder={t("artist.searchPlaceholder")}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 pr-10 pl-12"
                  variant="secondary"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View className="absolute left-3.5" pointerEvents="none">
                  <LocalSearch01Icon fill="none" width={20} height={20} color={muted} />
                </View>
                {searchQuery.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2"
                    isIconOnly
                    onPress={() => setSearchQuery("")}
                  >
                    <LocalCancel01Icon fill="none" width={18} height={18} color={muted} />
                  </Button>
                ) : null}
              </View>
            </TextField>
          </View>

          <BottomSheetScrollView
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">{t("artist.selectArtwork")}</Text>
              {isFetching ? <Spinner size="sm" /> : null}
            </View>

            {candidates.length > 0 ? (
              <View className="gap-2">
                {candidates.map((candidate) => {
                  const isCurrent = currentArtwork && currentArtwork.includes(String(candidate.id))

                  return (
                    <PressableFeedback
                      key={candidate.id}
                      onPress={() => void handleSelectCandidate(candidate)}
                      className="flex-row items-center gap-3.5 rounded-xl py-2 active:opacity-60"
                      style={{
                        backgroundColor: isCurrent ? border : "transparent",
                      }}
                    >
                      <View className="size-18 overflow-hidden rounded-xl bg-surface-secondary">
                        <Image
                          source={{ uri: candidate.picture_xl }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                          transition={200}
                        />
                      </View>
                      <View className="flex-1 gap-0.5">
                        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                          {candidate.name}
                        </Text>
                        <Text className="text-xs text-muted" numberOfLines={1}>
                          {candidate.nb_fan !== undefined
                            ? t("artist.fans", { count: candidate.nb_fan })
                            : candidate.nb_album !== undefined
                              ? t("artist.albums", { count: candidate.nb_album })
                              : `Deezer ID: ${candidate.id}`}
                        </Text>
                      </View>
                      {isCurrent ? (
                        <View
                          className="mr-2 size-7 items-center justify-center rounded-full"
                          style={{ backgroundColor: accent }}
                        >
                          <LocalTick02Icon
                            fill="none"
                            width={16}
                            height={16}
                            color={accentForeground}
                          />
                        </View>
                      ) : null}
                    </PressableFeedback>
                  )
                })}
              </View>
            ) : !isFetching ? (
              <EmptyState
                title={t("artist.noArtworkFound")}
                message={t("artist.searchPlaceholder")}
                className="py-12"
              />
            ) : null}
          </BottomSheetScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  )
}
