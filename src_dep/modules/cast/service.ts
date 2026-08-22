import type { CastState, RemoteMediaClient } from "react-native-google-cast"

import { logError, logInfo } from "@/modules/logging/service"

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
