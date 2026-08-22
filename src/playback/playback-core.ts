import AudioBrowser from "react-native-audio-browser"

import { getPreferenceState } from "@/core/preferences/store"
import type { DataTrack } from "@/domains/tracks/types"

import { getAudioBrowserOptions } from "@/lib/audio-browser"
import { loadCurrentTrack } from "./actions/controls"
import { getUpdatedLists } from "./queue-source"
import { extractTrackId, playbackStore } from "./playback-store"
import { createPlaybackQueueContext, type PlaybackQueueContext, type PlayerTrack } from "./types"

export async function setupPlaybackCore() {
  await AudioBrowser.setupPlayer({
    android: {
      allowedArtworkParentPaths: [],
      downsamplingProcessor: true,
    },
  })
  AudioBrowser.updateOptions(
    getAudioBrowserOptions({
      continuePlaybackOnDismiss: getPreferenceState().continuePlaybackOnDismiss,
    })
  )
}

export async function playFromTracks(options: {
  track: PlayerTrack
  tracks: PlayerTrack[]
  context: PlaybackQueueContext | null
  shuffle: boolean
}) {
  const trackIds = options.tracks.map((t) => t.id)
  const listInfo = getUpdatedLists(trackIds, options.shuffle, options.track.id)
  const activeKey = listInfo.queue[listInfo.queuePosition]

  if (!activeKey) {
    return false
  }

  let activeTrack: DataTrack | undefined = await playbackStore.getState().getTrack(activeKey)

  // The clicked track may carry fresher metadata than the DB row (e.g. an
  // external file that was just resolved), so prefer it for the active slot.
  if (!activeTrack || extractTrackId(activeKey) === options.track.id) {
    activeTrack = playerTrackToDataTrack(options.track)
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

  await loadCurrentTrack()
  AudioBrowser.play()
  return true
}

function playerTrackToDataTrack(track: PlayerTrack): DataTrack {
  return {
    id: track.id,
    name: track.title,
    artwork: track.image ?? track.albumArtwork ?? null,
    artists: track.artist ? [track.artist] : null,
    albumName: track.album ?? null,
    uri: track.uri,
    duration: track.duration ?? 0,
    artistName: track.artist ?? null,
    discoverTime: track.dateAdded ?? null,
    modificationTime: track.scanTime ?? null,
    rawArtistName: track.artist ?? null,
    albumId: track.albumId ?? null,
    parentFolder: null,
  }
}

export { createPlaybackQueueContext }
