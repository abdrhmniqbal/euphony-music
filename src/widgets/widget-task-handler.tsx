import { Appearance, Platform } from "react-native"

import {
  requestWidgetUpdate,
  type WidgetRepresentation,
  type WidgetTaskHandlerProps,
} from "react-native-android-widget"

import { PlayerWidget, type PlayerWidgetSnapshot, snapshotFromTrack } from "@/widgets/player-widget"
import { hydratePlaybackStore, readPersistedSnapshot } from "@/widgets/playback-snapshot"
import { playNext, playPrevious, togglePlayback } from "@/playback/controls"
import { playbackStore } from "@/playback/playback-store"
import { preferenceStore } from "@/core/preferences/store"
import { getStaticThemeColors } from "@/core/theme/colors"

const WIDGET_NAME = "Player"

async function ensurePreferencesHydrated(): Promise<void> {
  try {
    await preferenceStore.persist.rehydrate()
  } catch {
    // fall back to default theme colors in a cold widget context
  }
}

function themedPlayerWidget(snapshot: PlayerWidgetSnapshot): WidgetRepresentation {
  const { themeId, themeMode } = preferenceStore.getState()

  if (themeMode === "light") {
    const light = getStaticThemeColors(themeId, false)
    return {
      light: <PlayerWidget snapshot={snapshot} colors={light} />,
      dark: <PlayerWidget snapshot={snapshot} colors={light} />,
    }
  }

  if (themeMode === "dark") {
    const dark = getStaticThemeColors(themeId, true)
    return {
      light: <PlayerWidget snapshot={snapshot} colors={dark} />,
      dark: <PlayerWidget snapshot={snapshot} colors={dark} />,
    }
  }

  return {
    light: <PlayerWidget snapshot={snapshot} colors={getStaticThemeColors(themeId, false)} />,
    dark: (
      <PlayerWidget
        snapshot={snapshot}
        colors={getStaticThemeColors(themeId, Appearance.getColorScheme() === "dark")}
      />
    ),
  }
}

function representationFromStore(): WidgetRepresentation {
  const state = playbackStore.getState()
  return themedPlayerWidget(snapshotFromTrack(state.activeTrack, state.isPlaying))
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

  await ensurePreferencesHydrated()
  const { track, isPlaying } = await readPersistedSnapshot()
  renderWidget(themedPlayerWidget(snapshotFromTrack(track, isPlaying)))
}

export async function refreshPlayerWidget(): Promise<void> {
  if (Platform.OS !== "android") return

  try {
    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: async () => {
        await ensurePreferencesHydrated()
        return representationFromStore()
      },
      widgetNotFound: () => {},
    })
  } catch {
    // no widgets on the home screen, or headless rendering unavailable
  }
}
