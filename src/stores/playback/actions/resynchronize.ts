import AudioBrowser from "react-native-audio-browser"

import { removePlayedMediaList, updatePlayedMediaList } from "@/data/recent/api"
import { getTrack } from "@/data/track/api"
import type { PlayFromSource } from "../types"
import { arePlaybackSourceEqual, getSourceName } from "../utils"
import { playbackStore } from "../store"

import { applyReplayGainToTrack } from "@/modules/audio/replayGain/core/apply"

export async function onActiveTrack(args: { type: "album" | "track"; id: string }) {
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
  } catch {}
}

export async function onModifiedTracks(trackIds: string[]) {
  const idSet = new Set(trackIds)
  const { activeTrack } = playbackStore.getState()
  if (!activeTrack || !idSet.has(activeTrack.id)) return
  await onActiveTrack({ type: "track", id: activeTrack.id })
}

export async function onRename({
  oldSource,
  newSource,
}: {
  oldSource: PlayFromSource
  newSource: PlayFromSource
}) {
  try {
    await updatePlayedMediaList({ oldSource, newSource })
  } catch {
    await removePlayedMediaList(oldSource)
  }

  const { playingFrom } = playbackStore.getState()
  if (arePlaybackSourceEqual(playingFrom, oldSource)) {
    playbackStore.setState({
      playingFrom: newSource,
      playingFromName: await getSourceName(newSource),
    })
  }
}
