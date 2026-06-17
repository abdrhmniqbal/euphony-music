import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { albums, artists, playlists, tracks } from "@/db/schema"

export async function setTrackFavorite(id: string, favorite: boolean) {
  await db
    .update(tracks)
    .set({ isFavorite: favorite ? 1 : 0, favoritedAt: favorite ? Date.now() : null })
    .where(eq(tracks.id, id))
}

export async function setAlbumFavorite(id: string, favorite: boolean) {
  await db
    .update(albums)
    .set({ isFavorite: favorite ? 1 : 0, favoritedAt: favorite ? Date.now() : null })
    .where(eq(albums.id, id))
}

export async function setArtistFavorite(id: string, favorite: boolean) {
  await db
    .update(artists)
    .set({ isFavorite: favorite ? 1 : 0, favoritedAt: favorite ? Date.now() : null })
    .where(eq(artists.id, id))
}

export async function setPlaylistFavorite(id: string, favorite: boolean) {
  await db
    .update(playlists)
    .set({ isFavorite: favorite ? 1 : 0, favoritedAt: favorite ? Date.now() : null })
    .where(eq(playlists.id, id))
}
