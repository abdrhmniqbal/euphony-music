import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { View } from "react-native"
import type { SharedValue } from "react-native-reanimated"
import { CastButton } from "react-native-google-cast"

import LocalMoreHorizontalCircle01SolidIcon from "@/components/icons/local/more-horizontal-circle-01-solid"

import { PlayerDragHandle } from "./player-drag-handle"
import { QueueContextLabel } from "./queue-context-label"
import type { PlaybackQueueContext } from "@/playback/types"

interface PlayerHeaderProps {
  onClose: () => void
  onOpenMore?: () => void
  dragY: SharedValue<number>
  queueContext: PlaybackQueueContext | null
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  onClose,
  onOpenMore,
  dragY,
  queueContext,
}) => {
  return (
    <View className="relative mt-2 min-h-16 justify-center">
      <View pointerEvents="box-none" className="absolute left-0 z-20 flex-row items-center">
        <CastButton style={{ width: 24, height: 24, tintColor: "white" }} />
      </View>

      <PlayerDragHandle dragY={dragY} onClose={onClose} />

      {onOpenMore ? (
        <PressableFeedback onPress={onOpenMore} className="absolute right-0 z-20 p-1">
          <LocalMoreHorizontalCircle01SolidIcon fill="none" width={24} height={24} color="white" />
        </PressableFeedback>
      ) : null}

      <QueueContextLabel queueContext={queueContext} />
    </View>
  )
}
