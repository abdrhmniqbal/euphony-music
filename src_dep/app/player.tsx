/**
 * Purpose: Hosts the player route, expanded view state, route-level action sheets, and external audio intent playback.
 * Caller: Expo Router player route.
 * Dependencies: Player selectors, player intent runtime, queue context selector, UI store, shared artist picker, split settings parser, and player action sheet components.
 * Main Functions: PlayerRoute()
 * Side Effects: Navigates to artist route, toggles player sheets, and schedules player route intents.
 */

import * as Linking from "expo-linking"
import { Redirect, useLocalSearchParams } from "expo-router"
import { useGuardedRouter as useRouter } from "@/modules/navigation"
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"

import {
  ValueNavigationSheet,
  type ValueNavigationSheetItem,
} from "@/modules/library/ui/value-navigation-sheet"
import { buildArtistPickerItems } from "@/modules/library/artist-picker-utils"
import { FullPlayerContent } from "@/modules/player/ui/player/full-player-content"
import { PlayerActionSheet } from "@/modules/player/ui/player/action-sheet"
import { useCurrentTrack, useIsPlaying, usePlayerQueueContext } from "@/modules/player/selectors"
import {
  getPlayerIntentRuntimeSnapshot,
  schedulePlayerIntentRuntimeSync,
  subscribePlayerIntentRuntime,
} from "@/modules/player/intent-runtime"
import { useTrack } from "@/modules/tracks/queries"
import {
  isLikelyExternalFileIntent,
  normalizeExternalIntentUri,
} from "@/modules/player/external-track-utils"
import { splitArtistsValue } from "@/modules/settings/split-multiple-values"
import { useSettingsStore } from "@/modules/settings/store"
import { type PlayerExpandedView, setPlayerExpandedView, useUIStore } from "@/modules/ui/store"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, View } from "react-native"

function isPlayerExpandedView(value: string): value is PlayerExpandedView {
  return value === "artwork" || value === "lyrics" || value === "queue"
}

export default function PlayerRoute() {
  const router = useRouter()
  const { t } = useTranslation()
  const { initialView, externalUri } = useLocalSearchParams<{
    initialView?: string
    externalUri?: string
  }>()
  const currentTrack = useCurrentTrack()
  const isPlaying = useIsPlaying()
  const queueContext = usePlayerQueueContext()
  const splitMultipleValueConfig = useSettingsStore((state) => state.splitMultipleValueConfig)
  const playerExpandedView = useUIStore((state) => state.playerExpandedView)
  const { data: fullTrackData } = useTrack(currentTrack?.isExternal ? "" : (currentTrack?.id ?? ""))
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false)
  const [isArtistSelectionOpen, setIsArtistSelectionOpen] = useState(false)
  const intentSnapshot = useSyncExternalStore(
    subscribePlayerIntentRuntime,
    getPlayerIntentRuntimeSnapshot,
    getPlayerIntentRuntimeSnapshot
  )

  const externalUriValue =
    typeof externalUri === "string" && externalUri.length > 0 ? externalUri : null
  const initialViewValue =
    typeof initialView === "string" && isPlayerExpandedView(initialView) ? initialView : null

  schedulePlayerIntentRuntimeSync({
    initialView: initialViewValue,
    externalUri: externalUriValue,
    replaceRoute: (route) => {
      router.replace(route)
    },
  })

  // Catch external intents via Linking when route params don't update
  // (e.g. already on /player and new intent arrives on same route)
  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (isLikelyExternalFileIntent(url)) {
        const parsedUri = normalizeExternalIntentUri(url)
        if (parsedUri) {
          schedulePlayerIntentRuntimeSync({
            initialView: null,
            externalUri: parsedUri,
            replaceRoute: (route) => {
              router.replace(route)
            },
          })
        }
      }
    })

    return () => subscription.remove()
  }, [router])

  const artistNames = useMemo(() => {
    const relationNames = [
      fullTrackData?.artist?.name?.trim(),
      ...(fullTrackData?.featuredArtists?.map((entry) => entry.artist?.name?.trim()) ?? []),
    ].filter((value): value is string => Boolean(value))

    if (relationNames.length > 0) {
      return relationNames.filter(
        (value, index, all) =>
          all.findIndex((entry) => entry.toLowerCase() === value.toLowerCase()) === index
      )
    }

    if (!currentTrack?.artist) {
      return []
    }

    if (splitMultipleValueConfig.artistSplitMode === "original") {
      return [currentTrack.artist]
    }

    return splitArtistsValue(currentTrack.artist, splitMultipleValueConfig)
  }, [
    currentTrack?.artist,
    fullTrackData?.artist?.name,
    fullTrackData?.featuredArtists,
    splitMultipleValueConfig,
  ])

  const artistPickerItems = useMemo<ValueNavigationSheetItem[]>(
    () =>
      buildArtistPickerItems(
        {
          artwork: fullTrackData?.artwork,
          albumArtwork: fullTrackData?.album?.artwork,
          artist: fullTrackData?.artist,
          featuredArtists: fullTrackData?.featuredArtists,
        },
        artistNames,
        (count) => t("library.count.track", { count })
      ),
    [artistNames, fullTrackData, t]
  )

  if (externalUriValue && (intentSnapshot.isHandlingExternalUri || !currentTrack)) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!currentTrack) {
    return <Redirect href="/(main)/(home)" />
  }

  const dismissPlayer = () => {
    setPlayerExpandedView("artwork")
    setIsActionSheetOpen(false)
    setIsArtistSelectionOpen(false)
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace("/(main)/(home)")
    }
  }

  const handleNavigateAway = () => {
    setPlayerExpandedView("artwork")
    setIsActionSheetOpen(false)
    setIsArtistSelectionOpen(false)
  }

  const navigateToArtist = (artistName: string) => {
    const normalizedArtistName = artistName.trim()
    if (!normalizedArtistName) {
      return
    }

    handleNavigateAway()
    router.dismissTo({
      pathname: "/artist/[name]",
      params: { name: normalizedArtistName },
    })
  }

  const handleArtistPress = () => {
    if (artistNames.length <= 1) {
      navigateToArtist(artistNames[0] || currentTrack.artist || "")
      return
    }

    setIsArtistSelectionOpen(true)
  }

  return (
    <>
      <FullPlayerContent
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        playerExpandedView={playerExpandedView}
        queueContext={queueContext}
        onClose={dismissPlayer}
        onOpenMore={currentTrack.isExternal ? undefined : () => setIsActionSheetOpen(true)}
        onPressArtist={currentTrack.isExternal ? undefined : handleArtistPress}
      />

      <PlayerActionSheet
        visible={currentTrack.isExternal ? false : isActionSheetOpen}
        onOpenChange={setIsActionSheetOpen}
        track={currentTrack}
        artistNames={artistNames}
        onNavigate={handleNavigateAway}
      />

      <ValueNavigationSheet
        isOpen={currentTrack.isExternal ? false : isArtistSelectionOpen}
        onOpenChange={setIsArtistSelectionOpen}
        title={t("player.selectArtistTitle")}
        items={artistPickerItems}
        onSelectValue={(value) => {
          navigateToArtist(value)
        }}
      />
    </>
  )
}
