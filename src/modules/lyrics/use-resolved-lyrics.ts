import { useQuery } from "@tanstack/react-query"
import type { Track } from "@/modules/player/types"
import { resolveTrackLyricsSource } from "@/modules/lyrics/source"
import { stripMalformedUtf16LyricsPrefix } from "@/modules/lyrics/view-utils"
import { logWarn } from "@/modules/logging/service"
import { queryClient } from "@/lib/tanstack-query"

export function useResolvedLyrics(track: Track | null) {
  return useQuery(
    {
      queryKey: [
        "track-lyrics-source",
        track?.id ?? "",
        track?.uri ?? "",
        track?.fileHash ?? "",
        track?.scanTime ?? 0,
      ],
      enabled: Boolean(track?.id),
      staleTime: Infinity,
      queryFn: async () => {
        let sourceTrack = track
        if (sourceTrack?.id && !sourceTrack.lyrics) {
          try {
            const { db } = await import("@/db/client")
            const { tracks } = await import("@/db/schema")
            const { eq } = await import("drizzle-orm")
            const dbTrack = await db.query.tracks.findFirst({
              where: eq(tracks.id, sourceTrack.id),
              columns: { lyrics: true },
            })
            if (dbTrack?.lyrics) {
              sourceTrack = { ...sourceTrack, lyrics: dbTrack.lyrics }
            }
          } catch (error) {
            logWarn("Failed to hydrate lyrics from database fallback", {
              error,
              trackId: sourceTrack.id,
            })
          }
        }

        const source = resolveTrackLyricsSource(sourceTrack)
        return source ?? null
      },
      placeholderData: () => {
        const metadataLyrics = track?.lyrics
          ? stripMalformedUtf16LyricsPrefix(track.lyrics).trim()
          : ""
        return metadataLyrics ? metadataLyrics : null
      },
    },
    queryClient
  )
}
