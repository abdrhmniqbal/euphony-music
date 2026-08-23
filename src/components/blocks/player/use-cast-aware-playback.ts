import { useCallback } from "react"
import {
  MediaPlayerState,
  useCastState,
  useMediaStatus,
  useRemoteMediaClient,
  type CastState,
  type RemoteMediaClient,
} from "react-native-google-cast"

import { logError, logInfo } from "@/core/log/service"
import {
  playNext as localPlayNext,
  playPrevious as localPlayPrevious,
  seekTo as localSeekTo,
  togglePlayback as localTogglePlayback,
} from "@/playback/controls"

export function isCastConnected(
  castState: CastState | null | undefined,
  client: RemoteMediaClient | null
): client is RemoteMediaClient {
  return castState === "connected" && client !== null
}

async function runCastCommand(
  client: RemoteMediaClient,
  command: (client: RemoteMediaClient) => Promise<void>,
  label: string,
  metadata?: Record<string, unknown>
) {
  try {
    await command(client)
    logInfo(`Cast ${label} completed`, metadata)
  } catch (error) {
    logError(`Failed to ${label}`, error, metadata)
  }
}

export function toggleCastPlayback(client: RemoteMediaClient, isPlaying: boolean) {
  return runCastCommand(
    client,
    (c) => (isPlaying ? c.pause() : c.play()),
    "toggle playback",
    { isPlaying }
  )
}

export function seekCastPlayback(client: RemoteMediaClient, position: number) {
  return runCastCommand(client, (c) => c.seek({ position }), "seek", { position })
}

export function playCastNext(client: RemoteMediaClient) {
  return runCastCommand(client, (c) => c.queueNext(), "queue next")
}

export function playCastPrevious(client: RemoteMediaClient) {
  return runCastCommand(client, (c) => c.queuePrev(), "queue previous")
}

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

    await localTogglePlayback()
  }, [isCasting, remoteMediaClient, isCastPlaying])

  const handlePlayNext = useCallback(async () => {
    if (isCasting && remoteMediaClient) {
      await playCastNext(remoteMediaClient)
      return
    }

    await localPlayNext()
  }, [isCasting, remoteMediaClient])

  const handlePlayPrevious = useCallback(async () => {
    if (isCasting && remoteMediaClient) {
      await playCastPrevious(remoteMediaClient)
      return
    }

    await localPlayPrevious()
  }, [isCasting, remoteMediaClient])

  const seek = useCallback(
    async (seekTime: number) => {
      if (isCasting && remoteMediaClient) {
        await seekCastPlayback(remoteMediaClient, seekTime)
        return
      }

      await localSeekTo(seekTime)
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
