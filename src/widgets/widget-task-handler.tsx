import { Platform } from "react-native"

import {
  requestWidgetUpdate,
  type WidgetRepresentation,
  type WidgetTaskHandlerProps,
} from "react-native-android-widget"

import { PlayerWidget, type PlayerWidgetSnapshot, snapshotFromTrack } from "@/widgets/player-widget"
import { hydratePlaybackStore, readPersistedSnapshot } from "@/widgets/playback-snapshot"
import { playNext, playPrevious, togglePlayback } from "@/playback/controls"
import { playbackStore } from "@/playback/playback-store"

const WIDGET_NAME = "Player"

function playerRepresentation(snapshot: PlayerWidgetSnapshot): WidgetRepresentation {
  return {
    light: <PlayerWidget snapshot={snapshot} dark={false} />,
    dark: <PlayerWidget snapshot={snapshot} dark={true} />,
  }
}

function representationFromStore(): WidgetRepresentation {
  const state = playbackStore.getState()
  return playerRepresentation(snapshotFromTrack(state.activeTrack, state.isPlaying))
}

async function handleAction(action: string | undefined): Promise<void> {
  switch (action) {
    case "PLAY_PAUSE":
      await hydratePlaybackStore()
      await togglePlayback()
      break
    case "NEXT":
      await hydratePlaybackStore()
      await playNext()
      break
    case "PREVIOUS":
      await hydratePlaybackStore()
      await playPrevious()
      break
    default:
      break
  }
}

export async function widgetTaskHandler({
  widgetAction,
  clickAction,
  renderWidget,
}: WidgetTaskHandlerProps) {
  if (widgetAction === "WIDGET_CLICK") {
    if (clickAction === "OPEN_APP" || clickAction === "OPEN_URI") return

    try {
      await handleAction(clickAction)
    } catch {
      // playback controls may fail in a cold context; the widget still re-renders below
    }

    renderWidget(representationFromStore())
    return
  }

  if (widgetAction === "WIDGET_DELETED") return

  const { track, isPlaying } = await readPersistedSnapshot()
  renderWidget(playerRepresentation(snapshotFromTrack(track, isPlaying)))
}

export async function refreshPlayerWidget(): Promise<void> {
  if (Platform.OS !== "android") return

  try {
    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: async () => representationFromStore(),
      widgetNotFound: () => {},
    })
  } catch {
    // no widgets on the home screen, or headless rendering unavailable
  }
}
