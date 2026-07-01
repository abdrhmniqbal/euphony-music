import AudioBrowser from "react-native-audio-browser"

import { removePlayedMediaList, updatePlayedMediaList } from "@/modules/history/repository"
import { getTrack } from "@/modules/tracks/repository"
import { createPlaybackQueueContext, type PlayFromSource } from "../types"
import { arePlaybackSourceEqual, getSourceName } from "../utils"
import { playbackStore } from "../store"

import { applyReplayGainToTrack } from "@/modules/audio/replay-gain/core/apply"
import { logWarn } from "@/modules/logging/service"

async function onActiveTrack(args: { type: "album" | "track"; id: string }) {
  const { activeTrack } = playbackStore.getState()
  if (!activeTrack) return
  if (args.type === "album" && activeTrack.albumId !== args.id) return
  if (args.type === "track" && activeTrack.id !== args.id) return

  try {
    const updatedTrackData = await getTrack(activeTrack.id)
    playbackStore.setState({ activeTrack: updatedTrackData })

    const rnabTrack = AudioBrowser.getActiveTrack()
    if (!rnabTrack) return
    AudioBrowser.updateNowPlaying(await applyReplayGainToTrack(updatedTrackData, false))
  } catch (error) {
    logWarn("Failed to resynchronize active track metadata", error)
  }
}

async function onModifiedTracks(trackIds: string[]) {
  const idSet = new Set(trackIds)
  const { activeTrack } = playbackStore.getState()
  if (!activeTrack || !idSet.has(activeTrack.id)) return
  await onActiveTrack({ type: "track", id: activeTrack.id })
}

async function onRename({
  oldSource,
  newSource,
}: {
  oldSource: PlayFromSource
  newSource: PlayFromSource
}) {
  try {
    await updatePlayedMediaList({ oldSource, newSource })
  } catch (error) {
    logWarn("Failed to rename played media list, removing stale source instead", {
      error,
      oldSource,
      newSource,
    })
    await removePlayedMediaList(oldSource)
  }

  const { playingFrom } = playbackStore.getState()
  if (arePlaybackSourceEqual(playingFrom, oldSource)) {
    const sourceName = await getSourceName(newSource)
    playbackStore.setState({
      playingFrom: newSource,
      playingFromName: sourceName,
      queueContext: createPlaybackQueueContext(newSource.type, sourceName),
    })
  }
}
