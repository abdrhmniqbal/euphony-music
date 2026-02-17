import * as React from "react"
import { PressableFeedback } from "heroui-native"
import { View } from "react-native"

import LocalLiveStreamingIcon from "@/components/icons/local/live-streaming"
import LocalMoreHorizontalCircleSolidIcon from "@/components/icons/local/more-horizontal-circle-solid"
import LocalSlidersVerticalIcon from "@/components/icons/local/sliders-vertical"

interface PlayerHeaderProps {
  onClose: () => void
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({ onClose }) => (
  <View className="relative mt-2 h-10 flex-row items-center justify-between">
    <PressableFeedback>
      <LocalSlidersVerticalIcon
        fill="none"
        width={24}
        height={24}
        color="white"
      />
    </PressableFeedback>

    <PressableFeedback
      onPress={onClose}
      className="absolute -top-4 right-0 bottom-0 left-0 z-0 items-center justify-center p-4"
    >
      <View className="h-1.5 w-12 rounded-full bg-white/40" />
    </PressableFeedback>

    <View className="z-10 flex-row gap-8">
      <PressableFeedback>
        <LocalLiveStreamingIcon
          fill="none"
          width={24}
          height={24}
          color="white"
        />
      </PressableFeedback>
      <PressableFeedback>
        <LocalMoreHorizontalCircleSolidIcon
          fill="none"
          width={24}
          height={24}
          color="white"
        />
      </PressableFeedback>
    </View>
  </View>
)
