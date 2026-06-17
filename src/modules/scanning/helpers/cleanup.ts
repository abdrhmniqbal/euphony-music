import { db } from "@/db/client"
import { artworkCache } from "@/db/schema"

export const appCleanUp = {
  async tracks(_validTrackIds?: string[]) {
    return undefined
  },
  async media() {
    return undefined
  },
  async images() {
    await db.delete(artworkCache)
  },
}

export const AppCleanUp = appCleanUp
