import { useCallback } from "react"
import {
  MediaPlayerState,
  useCastState,
  useMediaStatus,
  useRemoteMediaClient,
} from "react-native-google-cast"

import {
  isCastConnected,
  playCastNext,
  playCastPrevious,
  seekCastPlayback,
  toggleCastPlayback,
} from "@/modules/cast/service"
import { playNext, playPrevious, seekTo, togglePlayback } from "@/modules/player/controls"

interface CastAwarePlayback {
  isCasting: boolean
  effectiveIsPlaying: boolean
  togglePlayback: () => Promise<void>
  playNext: () => Promise<void>
  playPrevious: () => Promise<void>
  seek: (time: number) => Promise<void>
}

export function useCastAwarePlayback(isPlaying: boolean): CastAwarePlayback {
  const castState = useCastState()
  const remoteMediaClient = useRemoteMediaClient()
  const mediaStatus = useMediaStatus()

  const isCasting = isCastConnected(castState, remoteMediaClient)
  const isCastPlaying = mediaStatus?.playerState === MediaPlayerState.PLAYING
  const effectiveIsPlaying = isCasting ? isCastPlaying : isPlaying

  const handleTogglePlayback = useCallback(async () => {
    if (isCasting && remoteMediaClient) {
      await toggleCastPlayback(remoteMediaClient, isCastPlaying)
      return
    }

    await togglePlayback()
  }, [isCasting, remoteMediaClient, isCastPlaying])

  const handlePlayNext = useCallback(async () => {
    if (isCasting && remoteMediaClient) {
      await playCastNext(remoteMediaClient)
      return
    }

    await playNext()
  }, [isCasting, remoteMediaClient])

  const handlePlayPrevious = useCallback(async () => {
    if (isCasting && remoteMediaClient) {
      await playCastPrevious(remoteMediaClient)
      return
    }

    await playPrevious()
  }, [isCasting, remoteMediaClient])

  const seek = useCallback(
    async (seekTime: number) => {
      if (isCasting && remoteMediaClient) {
        await seekCastPlayback(remoteMediaClient, seekTime)
        return
      }

      await seekTo(seekTime)
    },
    [isCasting, remoteMediaClient]
  )

  return {
    isCasting,
    effectiveIsPlaying,
    togglePlayback: handleTogglePlayback,
    playNext: handlePlayNext,
    playPrevious: handlePlayPrevious,
    seek,
  }
}
