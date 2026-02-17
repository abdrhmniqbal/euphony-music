import {
  getTopTracksByPeriod,
  type HistoryTopTracksPeriod,
} from "@/modules/history/history.api"

export type TopTracksPeriod = HistoryTopTracksPeriod

export async function getTopTracks(
  period: TopTracksPeriod = "all",
  limit: number = 25
) {
  return getTopTracksByPeriod(period, limit)
}
