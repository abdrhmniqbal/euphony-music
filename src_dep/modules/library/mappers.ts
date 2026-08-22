/**
 * Purpose: Pure row-to-domain mappers for library repository results.
 * Caller: Library repository (getAlbum, getAlbumsSummary, getArtist, getArtistsSummary).
 * Dependencies: Library data types (type-only).
 * Main Functions: toDataAlbum(), toDataArtist()
 * Side Effects: None.
 */

import type { Album, Artist } from "@/modules/library/data-types"

export interface AlbumMappableRow {
  id: string
  title: string
  artwork: string | null
  isFavorite?: number | null
  trackCount?: number | null
  artist?: { name: string | null } | null
}

export interface ArtistMappableRow {
  id: string
  name: string
  artwork: string | null
  isFavorite?: number | null
  trackCount?: number | null
  albumCount?: number | null
}

export function toDataAlbum(row: AlbumMappableRow): Album {
  return {
    id: row.id,
    name: row.title,
    artwork: row.artwork ?? null,
    artists: row.artist?.name ? [row.artist.name] : [],
    isFavorite: row.isFavorite === 1,
    trackCount: row.trackCount ?? 0,
  }
}

export function toDataArtist(row: ArtistMappableRow): Artist {
  return {
    id: row.id,
    name: row.name,
    artwork: row.artwork ?? null,
    isFavorite: row.isFavorite === 1,
    trackCount: row.trackCount ?? 0,
    albumCount: row.albumCount ?? 0,
  }
}
