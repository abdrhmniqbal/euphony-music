/**
 * Purpose: Maps between Startune playback tracks and native TrackPlayer queue items.
 * Caller: player service, queue service, controls, session restore, and playback event sync.
 * Dependencies: player domain types and TrackPlayer repeat mode constants.
 * Main Functions: mapTrackPlayerTrackToTrack(), mapTrackToTrackPlayerInput(), mapTrackPlayerRepeatMode(), mapRepeatMode()
 * Side Effects: None.
 */

import { EXTERNAL_TRACK_ID_PREFIX, type RepeatModeType, type Track } from "@/modules/player/types"
import { RepeatMode } from "@/modules/player/utils"

interface TrackPlayerTrackLike {
  id?: string | number
  title?: string | null
  artist?: string | null
  album?: string | null
  duration?: number | null
  url?: string | null
  artwork?: string | null
}

export function mapTrackPlayerTrackToTrack(track: TrackPlayerTrackLike, allTracks: Track[]): Track {
  const rawTrackId = track.id
  const trackId = rawTrackId !== undefined ? String(rawTrackId) : null
  const matchedTrack = trackId ? allTracks.find((item) => item.id === trackId) : undefined

  return {
    ...matchedTrack,
    id: trackId ?? matchedTrack?.id ?? "",
    title:
      typeof track.title === "string" && track.title.length > 0
        ? track.title
        : (matchedTrack?.title ?? "Unknown Track"),
    artist: typeof track.artist === "string" ? track.artist : matchedTrack?.artist,
    album: typeof track.album === "string" ? track.album : matchedTrack?.album,
    duration: typeof track.duration === "number" ? track.duration : (matchedTrack?.duration ?? 0),
    uri: typeof track.url === "string" ? track.url : (matchedTrack?.uri ?? ""),
    image: typeof track.artwork === "string" ? track.artwork : matchedTrack?.image,
    isExternal:
      matchedTrack?.isExternal === true || trackId?.startsWith(EXTERNAL_TRACK_ID_PREFIX) === true,
  }
}

export function mapTrackToTrackPlayerInput(track: Track) {
  return {
    id: track.id,
    url: track.uri,
    title: track.title,
    artist: track.artist,
    album: track.album,
    artwork: track.image,
    duration: track.duration,
  }
}

export function mapTrackPlayerRepeatMode(mode: RepeatMode): RepeatModeType {
  switch (mode) {
    case RepeatMode.Track:
      return "track"
    case RepeatMode.Queue:
      return "queue"
    case RepeatMode.Off:
    default:
      return "off"
  }
}

export function mapRepeatMode(mode: RepeatModeType): RepeatMode {
  switch (mode) {
    case "track":
      return RepeatMode.Track
    case "queue":
      return RepeatMode.Queue
    case "off":
    default:
      return RepeatMode.Off
  }
}
