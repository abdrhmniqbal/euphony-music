import { i18n } from "@/core/localization/i18n"
import { getPreferenceState } from "@/core/preferences/store"
import type { DataTrack } from "@/domains/tracks/types"

import { playTrack } from "./service"
import { createPlaybackQueueContext } from "./types"
import { toPlayerTracks } from "./player-track"

export function playTrackList(tracks: DataTrack[], title: string) {
  if (tracks.length === 0) return
  const queue = toPlayerTracks(tracks, getPreferenceState().splitMultipleValueConfig)
  void playTrack(queue[0], queue, createPlaybackQueueContext("trackList", title))
}

export function shuffleTrackList(tracks: DataTrack[], title: string) {
  if (tracks.length === 0) return
  const queue = toPlayerTracks(tracks, getPreferenceState().splitMultipleValueConfig)
  const randomIndex = Math.floor(Math.random() * queue.length)
  void playTrack(
    queue[randomIndex],
    queue,
    createPlaybackQueueContext("trackList", title || i18n.t("library.tracks"))
  )
}

export function playSingleTrackFromList(track: DataTrack, sortedQueue: DataTrack[], title: string) {
  const queue = toPlayerTracks(
    sortedQueue.length > 0 ? sortedQueue : [track],
    getPreferenceState().splitMultipleValueConfig
  )
  const playerTrack = queue.find((item) => item.id === track.id) ?? queue[0]
  if (!playerTrack) return
  void playTrack(playerTrack, queue, createPlaybackQueueContext("trackList", title))
}
