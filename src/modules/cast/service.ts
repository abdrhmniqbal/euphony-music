import type { CastState, RemoteMediaClient } from "react-native-google-cast"

import { logError, logInfo } from "@/modules/logging/service"

export function isCastConnected(
  castState: CastState | null | undefined,
  client: RemoteMediaClient | null
): client is RemoteMediaClient {
  return castState === "connected" && client !== null
}

export async function toggleCastPlayback(client: RemoteMediaClient, isPlaying: boolean) {
  try {
    logInfo("Toggling cast playback", { isPlaying })
    if (isPlaying) {
      await client.pause()
      return
    }

    await client.play()
  } catch (error) {
    logError("Failed to toggle cast playback", error)
  }
}

export async function seekCastPlayback(client: RemoteMediaClient, position: number) {
  try {
    await client.seek({ position })
    logInfo("Cast seek completed", { position })
  } catch (error) {
    logError("Failed to seek cast playback", error, { position })
  }
}

export async function playCastNext(client: RemoteMediaClient) {
  try {
    await client.queueNext()
    logInfo("Cast skipped to next item")
  } catch (error) {
    logError("Failed to skip cast queue next", error)
  }
}

export async function playCastPrevious(client: RemoteMediaClient) {
  try {
    await client.queuePrev()
    logInfo("Cast skipped to previous item")
  } catch (error) {
    logError("Failed to skip cast queue previous", error)
  }
}
