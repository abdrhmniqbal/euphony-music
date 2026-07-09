import { useQuery } from "@tanstack/react-query"
import { maybeGetTrack } from "@/modules/tracks/repository"
import { toPlayerTrack } from "@/modules/player/playback-subscriber"
import type { Track } from "@/modules/player/store"
import { extractTrackId } from "@/stores/playback/utils"

export function useQueueTracks(trackKeys: string[]): Record<string, Track | null> {
  const trackIds = trackKeys.map(extractTrackId)

  const { data } = useQuery({
    queryKey: ["queue", "tracks", ...trackIds.sort()],
    queryFn: async () => {
      const results = await Promise.all(
        trackIds.map(async (id) => {
          const t = await maybeGetTrack(id)
          return [id, t ? toPlayerTrack(t) : null] as const
        })
      )
      return Object.fromEntries(results) as Record<string, Track | null>
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  return data ?? {}
}
