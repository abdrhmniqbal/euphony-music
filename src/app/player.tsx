import { Redirect, useLocalSearchParams, useRouter } from "expo-router"
import { useState } from "react"

import { FullPlayerContent } from "@/components/blocks/player/full-player-content"
import { PlayerActionSheet } from "@/components/blocks/player/action-sheet/content"
import { useCurrentTrack, useIsPlaying, usePlayerQueueContext } from "@/playback/selectors"
import { setPlayerExpandedView, useUIStore } from "@/core/ui/store"

export default function PlayerRoute() {
  const router = useRouter()
  useLocalSearchParams<{
    initialView?: string
    transitionId?: string
  }>()
  const currentTrack = useCurrentTrack()
  const isPlaying = useIsPlaying()
  const queueContext = usePlayerQueueContext()
  const playerExpandedView = useUIStore((state) => state.playerExpandedView)
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false)

  if (!currentTrack) {
    return <Redirect href="/(main)/(home)" />
  }

  const dismissPlayer = () => {
    setPlayerExpandedView("artwork")
    setIsActionSheetOpen(false)
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace("/(main)/(home)")
    }
  }

  return (
    <>
      <FullPlayerContent
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        playerExpandedView={playerExpandedView}
        queueContext={queueContext}
        onClose={dismissPlayer}
        onOpenMore={() => setIsActionSheetOpen(true)}
      />

      <PlayerActionSheet
        visible={isActionSheetOpen}
        onOpenChange={setIsActionSheetOpen}
        track={currentTrack}
      />
    </>
  )
}
