import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/db/client";
import { tracks, playHistory } from "@/db/schema";
import { eq, desc, sql, count } from "drizzle-orm";

const HISTORY_KEY = "play-history";

export type PlayPeriod = "all" | "day" | "week";

export function usePlayHistory(limit?: number) {
  return useQuery({
    queryKey: [HISTORY_KEY, limit],
    queryFn: async () => {
      let query = db.query.playHistory.findMany({
        orderBy: [desc(playHistory.playedAt)],
        with: {
          track: true,
        },
        limit: limit || 50,
      });

      return query;
    },
  });
}

export function useAddToHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackId: string) => {
      await db.insert(playHistory).values({
        id: `${trackId}-${Date.now()}`,
        trackId,
        playedAt: Date.now(),
        duration: 0,
        completed: 0,
      });

      // Keep only last 50 entries
      const count = await db
        .select({ count: sql<number>`count(*)` })
        .from(playHistory);
      
      if (count[0]?.count > 50) {
        await db
          .delete(playHistory)
          .where(
            sql`id NOT IN (SELECT id FROM ${playHistory} ORDER BY played_at DESC LIMIT 50)`
          );
      }

      return trackId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HISTORY_KEY] });
    },
  });
}

export function useIncrementPlayCount() {
  const queryClient = useQueryClient();
  const addToHistory = useAddToHistory();

  return useMutation({
    mutationFn: async (trackId: string) => {
      // Increment play count and update last played
      await db
        .update(tracks)
        .set({
          playCount: sql`${tracks.playCount} + 1`,
          lastPlayedAt: Date.now(),
        })
        .where(eq(tracks.id, trackId));

      // Add to history
      await addToHistory.mutateAsync(trackId);

      return trackId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
      queryClient.invalidateQueries({ queryKey: [HISTORY_KEY] });
    },
  });
}

export function useTopSongs(period: PlayPeriod = "all", limit: number = 25) {
  return useQuery({
    queryKey: ["top-songs", period, limit],
    queryFn: async () => {
      if (period === "all") {
        return db.query.tracks.findMany({
          where: sql`${tracks.playCount} > 0 AND ${tracks.isDeleted} = 0`,
          orderBy: [desc(tracks.playCount), desc(tracks.lastPlayedAt)],
          limit,
        });
      } else {
        const timeThreshold =
          period === "day"
            ? Date.now() - 24 * 60 * 60 * 1000
            : Date.now() - 7 * 24 * 60 * 60 * 1000;

        const history = await db.query.playHistory.findMany({
          where: sql`${playHistory.playedAt} >= ${timeThreshold}`,
          with: {
            track: true,
          },
        });

        // Group by track and count plays
        const trackCounts = new Map<string, { track: typeof history[0]["track"]; count: number }>();
        
        for (const entry of history) {
          if (entry.track && !entry.track.isDeleted) {
            const existing = trackCounts.get(entry.trackId);
            if (existing) {
              existing.count++;
            } else {
              trackCounts.set(entry.trackId, { track: entry.track, count: 1 });
            }
          }
        }

        // Convert to array and sort
        const sorted = Array.from(trackCounts.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, limit)
          .map((item) => item.track);

        return sorted;
      }
    },
  });
}