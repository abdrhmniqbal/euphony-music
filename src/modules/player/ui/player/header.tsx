/**
 * Purpose: Renders expanded player top controls: cast button, drag handle, more button, and queue context.
 * Caller: FullPlayerContent.
 * Dependencies: extracted subcomponents PlayerDragHandle and QueueContextLabel.
 */

import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { View } from "react-native"
import type { SharedValue } from "react-native-reanimated"

import { CastButton } from "react-native-google-cast"
import type { PlayerQueueContext } from "@/modules/player/types"
import LocalMoreHorizontalCircle01SolidIcon from "@/modules/shared/components/icons/local/more-horizontal-circle-01-solid"

import { PlayerDragHandle } from "./player-drag-handle"
import { QueueContextLabel } from "./queue-context-label"

interface PlayerHeaderProps {
  onClose: () => void
  onOpenMore?: () => void
  dragY: SharedValue<number>
  queueContext: PlayerQueueContext | null
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  onClose,
  onOpenMore,
  dragY,
  queueContext,
}) => {
  return (
    <View className="relative mt-2 min-h-16 justify-center">
      <View className="absolute left-0 z-20 p-1">
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
