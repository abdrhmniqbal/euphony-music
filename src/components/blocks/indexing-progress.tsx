/**
 * Purpose: Bridges indexer progress state into the persistent progress toast UI.
 * Caller: Root provider tree.
 * Dependencies: HeroUI Native toast, indexer store/service, indexing progress toast runtime, and theme colors.
 * Main Functions: IndexingProgress()
 * Side Effects: Schedules progress toast show/hide and stop-indexing actions.
 */

import {
  PressableFeedback,
  Toast,
  type ToastComponentProps,
  useToast,
} from "heroui-native"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import Animated, {
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated"

import LocalCancelIcon from "@/components/icons/local/cancel"
import { useThemeColors } from "@/modules/ui/theme"
import { stopIndexing } from "@/modules/indexer/service"
import { useIndexerStore } from "@/modules/indexer/store"
import { scheduleIndexingProgressToastSync } from "@/modules/indexer/progress-toast-runtime"

function IndexingProgressToast(props: ToastComponentProps) {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const state = useIndexerStore((store) => store.indexerState)
  const phaseLabels: Record<string, string> = {
    idle: "",
    scanning: t("indexing.scanning"),
    processing: t("indexing.processing"),
    cleanup: t("indexing.cleanup"),
    complete: t("indexing.complete"),
    paused: t("indexing.paused"),
  }

  const normalizedProgress = Math.min(Math.max(state.progress / 100, 0), 1)
  const animatedProgress = useDerivedValue(() =>
    withTiming(normalizedProgress, {
      duration: 300,
    })
  )

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }))

  if (state.phase === "complete") {
    return (
      <Toast {...props} variant="accent" placement="bottom" isSwipeable={false}>
        <View className="flex-row items-center gap-3 px-4 py-3">
          <View className="flex-1">
            <Toast.Title className="text-sm font-semibold">
              {phaseLabels.complete}
            </Toast.Title>
            <Toast.Description className="text-xs text-muted">
              {t("indexing.tracksIndexed", {
                count: state.totalFiles,
              })}
            </Toast.Description>
          </View>
        </View>
      </Toast>
    )
  }

  return (
    <Toast {...props} variant="accent" placement="bottom" isSwipeable={false}>
      <View className="gap-2 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Toast.Title className="text-sm font-semibold">
              {phaseLabels[state.phase]}
            </Toast.Title>
          </View>

          <PressableFeedback
            onPress={stopIndexing}
            className="p-1 active:opacity-50"
            hitSlop={8}
          >
            <LocalCancelIcon
              fill="none"
              width={18}
              height={18}
              color={theme.muted}
            />
          </PressableFeedback>
        </View>

        <View className="h-1.5 w-full overflow-hidden rounded-full bg-muted/20">
          <Animated.View
            style={progressBarStyle}
            className="h-full rounded-full bg-accent"
          />
        </View>

        <View className="flex-row items-center justify-between">
          <Text
            className="flex-1 text-xs text-muted"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {state.currentFile || t("indexing.preparing")}
          </Text>
          <Text className="ml-2 text-xs text-muted">
            {state.processedFiles}/{state.totalFiles}
          </Text>
        </View>
      </View>
    </Toast>
  )
}

export function IndexingProgress() {
  const state = useIndexerStore((store) => store.indexerState)
  const { toast } = useToast()

  scheduleIndexingProgressToastSync({
    state,
    toast,
    component: (props) => <IndexingProgressToast {...props} />,
  })

  return null
}
