import { atom } from "nanostores"

import { toggleFavoriteDB } from "@/modules/favorites/favorites.store"
import {
  addTrackToHistory,
  incrementTrackPlayCount,
} from "@/modules/history/history.api"
import {
  Capability,
  Event,
  RepeatMode,
  State,
  TrackPlayer,
} from "@/modules/player/player.utils"

import type { Album, Artist, LyricLine, Track } from "./player.types"

export type { Album, Artist, LyricLine, Track }

export const $tracks = atom<Track[]>([])
export const $currentTrack = atom<Track | null>(null)
export const $isPlaying = atom(false)
export const $currentTime = atom(0)
export const $duration = atom(0)

export type RepeatModeType = "off" | "track" | "queue"
export const $repeatMode = atom<RepeatModeType>("off")

let isPlayerReady = false
let currentTrackIndex = -1

// Note: loadFavorites() is now called after database initialization in DatabaseProvider

export async function setupPlayer() {
  try {
    // Check if player is already initialized
    if (isPlayerReady) {
      return
    }

    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
    })

    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      progressUpdateEventInterval: 1,
    })

    isPlayerReady = true
  } catch (e: any) {
    // If already initialized, mark as ready
    if (e?.message?.includes("already been initialized")) {
      isPlayerReady = true
    }
  }
}

// Playback service for background controls
export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play()
  })

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause()
  })

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    playNext()
  })

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    playPrevious()
  })

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    if (event.position !== undefined) {
      TrackPlayer.seekTo(event.position)
    }
  })

  TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
    $isPlaying.set(event.state === State.Playing)
  })

  // v4 API: Use PlaybackTrackChanged with nextTrack property
  TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async (event) => {
    if (event.nextTrack !== undefined && event.nextTrack !== null) {
      const track = await TrackPlayer.getTrack(event.nextTrack)
      if (track) {
        const currentTrack: Track = {
          id: track.id as string,
          title: track.title as string,
          artist: track.artist,
          album: track.album,
          duration: track.duration || 0,
          uri: track.url as string,
          image: track.artwork as string | undefined,
        }
        $currentTrack.set(currentTrack)

        addTrackToHistory(currentTrack.id)
        incrementTrackPlayCount(currentTrack.id)
      }
    }
  })

  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
    $currentTime.set(event.position)
    $duration.set(event.duration)
  })
}

export async function playTrack(track: Track, playlistTracks?: Track[]) {
  if (!isPlayerReady) {
    return
  }

  try {
    const { setQueue } = await import("./queue.store")

    await TrackPlayer.reset()

    const tracks = playlistTracks || $tracks.get()
    currentTrackIndex = tracks.findIndex((t) => t.id === track.id)

    const queue = tracks
      .slice(currentTrackIndex)
      .concat(tracks.slice(0, currentTrackIndex))

    setQueue(queue)

    await TrackPlayer.add(
      queue.map((t) => ({
        id: t.id,
        url: t.uri,
        title: t.title,
        artist: t.artist,
        album: t.album,
        artwork: t.image,
        duration: t.duration,
      }))
    )

    $currentTrack.set(track)

    addTrackToHistory(track.id)
    incrementTrackPlayCount(track.id)

    await TrackPlayer.play()
    $isPlaying.set(true)
  } catch {}
}

export async function pauseTrack() {
  try {
    await TrackPlayer.pause()
    $isPlaying.set(false)
  } catch {}
}

export async function resumeTrack() {
  try {
    await TrackPlayer.play()
    $isPlaying.set(true)
  } catch {}
}

export async function togglePlayback() {
  // v4 API: getState() returns the state directly
  const state = await TrackPlayer.getState()
  if (state === State.Playing) {
    await pauseTrack()
  } else {
    await resumeTrack()
  }
}

export async function playNext() {
  try {
    await TrackPlayer.skipToNext()
    // v4 API: getCurrentTrack() returns the track ID (string)
    const currentTrackId = await TrackPlayer.getCurrentTrack()
    if (currentTrackId !== undefined && currentTrackId !== null) {
      const track = await TrackPlayer.getTrack(currentTrackId)
      if (track) {
        // Map from TrackPlayer's Track format back to our Track interface
        $currentTrack.set({
          id: track.id as string,
          title: track.title as string,
          artist: track.artist,
          album: track.album,
          duration: track.duration || 0,
          uri: track.url as string,
          image: track.artwork as string | undefined,
        } as Track)
      }
    }
  } catch {
    // If at end of queue, wrap to beginning
    const tracks = $tracks.get()
    if (tracks.length > 0) {
      await playTrack(tracks[0])
    }
  }
}

export async function playPrevious() {
  try {
    // v4 API: getPosition() returns position directly
    const position = await TrackPlayer.getPosition()
    if (position > 3) {
      await TrackPlayer.seekTo(0)
    } else {
      await TrackPlayer.skipToPrevious()
      // v4 API: getCurrentTrack() returns the track ID (string)
      const currentTrackId = await TrackPlayer.getCurrentTrack()
      if (currentTrackId !== undefined && currentTrackId !== null) {
        const track = await TrackPlayer.getTrack(currentTrackId)
        if (track) {
          // Map from TrackPlayer's Track format back to our Track interface
          $currentTrack.set({
            id: track.id as string,
            title: track.title as string,
            artist: track.artist,
            album: track.album,
            duration: track.duration || 0,
            uri: track.url as string,
            image: track.artwork as string | undefined,
          } as Track)
        }
      }
    }
  } catch {
    // If at beginning of queue, stay at first track
  }
}

export async function seekTo(seconds: number) {
  try {
    await TrackPlayer.seekTo(seconds)
  } catch {}
}

export async function setRepeatMode(mode: RepeatModeType) {
  try {
    let trackPlayerMode: RepeatMode
    switch (mode) {
      case "track":
        trackPlayerMode = RepeatMode.Track
        break
      case "queue":
        trackPlayerMode = RepeatMode.Queue
        break
      case "off":
      default:
        trackPlayerMode = RepeatMode.Off
    }
    await TrackPlayer.setRepeatMode(trackPlayerMode)
    $repeatMode.set(mode)
  } catch {}
}

export async function toggleRepeatMode() {
  const currentMode = $repeatMode.get()
  const nextMode: RepeatModeType =
    currentMode === "off" ? "track" : currentMode === "track" ? "queue" : "off"
  await setRepeatMode(nextMode)
}

export function toggleFavorite(trackId: string) {
  const tracks = $tracks.get()
  const index = tracks.findIndex((t) => t.id === trackId)
  if (index === -1) return

  const track = tracks[index]
  const newStatus = !track.isFavorite

  // Create new array reference for immutability
  const newTracks = [...tracks]
  newTracks[index] = { ...track, isFavorite: newStatus }
  $tracks.set(newTracks)

  const current = $currentTrack.get()
  if (current?.id === trackId) {
    $currentTrack.set({ ...current, isFavorite: newStatus })
  }

  toggleFavoriteDB(trackId, newStatus)
}

export async function setQueue(tracks: Track[]) {
  $tracks.set(tracks)
}

// Load tracks from database
export async function loadTracks() {
  try {
    const { getAllTracks } = await import("@/modules/player/player.api")
    const trackList = await getAllTracks()
    $tracks.set(trackList)
  } catch {}
}
