/**
 * Purpose: Defines typed Drizzle result shapes used by cross-module transformers.
 * Caller: Repository modules and DB-to-domain transformer utilities.
 * Dependencies: Drizzle inferred schema models.
 * Main Functions: DBTrack, DBArtist, DBAlbum, DBGenre.
 * Side Effects: None.
 */

import type { InferSelectModel } from "drizzle-orm"

import type { albums, artists, genres, tracks } from "@/db/schema"

export type DBTrack = InferSelectModel<typeof tracks> & {
  artist: InferSelectModel<typeof artists> | null
  album:
    | (InferSelectModel<typeof albums> & {
        artist?: InferSelectModel<typeof artists> | null
      })
    | null
  genres?: Array<{ genre: InferSelectModel<typeof genres> | null }>
  featuredArtists?: Array<{ artist: InferSelectModel<typeof artists> | null }>
}

export type DBArtist = InferSelectModel<typeof artists>
export type DBAlbum = InferSelectModel<typeof albums> & {
  artist: InferSelectModel<typeof artists> | null
}
export type DBGenre = InferSelectModel<typeof genres>
