import AudioBrowser from "react-native-audio-browser"

import type { PlayerQueueContext, Track } from "@/modules/player/types"
import type { Track as DataTrack } from "@/modules/tracks/types"
import { PlaybackControls } from "@/stores/playback/actions"
import { playbackStore } from "@/stores/playback/store"
import { preferenceStore } from "@/stores/preference/store"
import { getUpdatedLists, extractTrackId } from "@/stores/playback/utils"

import { getAudioBrowserOptions } from "@/lib/react-native-audio-browser"

export async function setupPlaybackCore() {
  await AudioBrowser.setupPlayer({
    android: {
      allowedArtworkParentPaths: [],
      downsamplingProcessor: true,
    },
  })
  AudioBrowser.updateOptions(
    getAudioBrowserOptions({
      continuePlaybackOnDismiss: preferenceStore.getState().continuePlaybackOnDismiss,
    })
  )
}

export async function playFromTracks(options: {
  track: Track
  tracks: Track[]
  context: PlayerQueueContext | null
  shuffle: boolean
}) {
  const trackIds = options.tracks.map((t) => t.id)
  const listInfo = getUpdatedLists(trackIds, options.shuffle, options.track.id)
  const activeKey = listInfo.queue[listInfo.queuePosition]

  let activeTrack: DataTrack | undefined
  if (options.track.isExternal && options.track.id === extractTrackId(activeKey!)) {
    activeTrack = {
      id: options.track.id,
      name: options.track.title,
      artwork: options.track.image ?? options.track.albumArtwork ?? null,
      artists: options.track.artist ? [options.track.artist] : null,
      albumName: options.track.album ?? null,
      uri: options.track.uri,
      duration: options.track.duration ?? 0,
      artistName: options.track.artist ?? null,
      discoverTime: null,
      modificationTime: null,
      rawArtistName: options.track.artist ?? null,
      albumId: options.track.albumId ?? null,
      parentFolder: null,
    }
  } else {
    activeTrack = await playbackStore.getState().getTrack(activeKey!)
  }

  if (!activeTrack) return false

  playbackStore.setState({
    isPlaying: true,
    lastPosition: 0,
    ...listInfo,
    activeKey,
    activeTrack,
    queueContext: options.context,
  })

  await PlaybackControls.loadCurrentTrack()
  AudioBrowser.play()
  return true
}
