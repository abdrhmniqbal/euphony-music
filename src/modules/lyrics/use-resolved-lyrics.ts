import { useQuery } from "@tanstack/react-query"
import type { Track } from "@/modules/player/types"
import {
  resolveTrackLyricsSource,
  fetchAndPersistLyrics,
  loadLyricsFromDatabase,
} from "@/modules/lyrics/source"
import { stripMalformedUtf16LyricsPrefix } from "@/modules/lyrics/view-utils"
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
        if (sourceTrack?.id && (sourceTrack.lyrics === undefined || sourceTrack.lyrics === null)) {
          const dbLyrics = await loadLyricsFromDatabase(sourceTrack.id)
          if (dbLyrics !== null) {
            sourceTrack = { ...sourceTrack, lyrics: dbLyrics }
          }
        }

        if (sourceTrack?.lyrics) {
          const source = resolveTrackLyricsSource(sourceTrack)
          if (source) {
            return source
          }
        }

        if (sourceTrack?.lyrics === "") {
          return null
        }

        if (sourceTrack?.id && sourceTrack.title) {
          const fetchedLyrics = await fetchAndPersistLyrics(sourceTrack)
          if (fetchedLyrics) {
            sourceTrack = { ...sourceTrack, lyrics: fetchedLyrics }
            return resolveTrackLyricsSource(sourceTrack) ?? null
          }
        }

        return null
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
