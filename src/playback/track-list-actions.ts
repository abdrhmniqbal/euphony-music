import { i18n } from "@/core/localization/i18n"
import { createPlaybackQueueContext } from "./types"
import type { PlayerTrack } from "./types"
import { playTrack } from "./service"

export function playTrackList(tracks: PlayerTrack[], title: string) {
  if (tracks.length === 0) return
  void playTrack(tracks[0], tracks, createPlaybackQueueContext("trackList", title))
}

export function shuffleTrackList(tracks: PlayerTrack[], title: string) {
  if (tracks.length === 0) return
  const randomIndex = Math.floor(Math.random() * tracks.length)
  void playTrack(
    tracks[randomIndex],
    tracks,
    createPlaybackQueueContext("trackList", title || i18n.t("library.tracks"))
  )
}

export function playSingleTrackFromList(track: PlayerTrack, queue: PlayerTrack[], title: string) {
  const playerTrack = queue.find((item) => item.id === track.id) ?? queue[0]
  if (!playerTrack) return
  void playTrack(playerTrack, queue, createPlaybackQueueContext("trackList", title))
}
