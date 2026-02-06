import type { Track } from "@/features/player/player.types";
import type { DBTrack, DBAlbum, DBArtist } from "@/types/database";
import type { Album, Artist } from "@/features/player/player.types";

export const transformDBTrackToTrack = (dbTrack: DBTrack): Track => ({
    id: dbTrack.id,
    title: dbTrack.title,
    artist: dbTrack.artist?.name,
    artistId: dbTrack.artistId || undefined,
    albumArtist: dbTrack.artist?.name,
    album: dbTrack.album?.title,
    albumId: dbTrack.albumId || undefined,
    duration: dbTrack.duration,
    uri: dbTrack.uri,
    image: dbTrack.album?.artwork || dbTrack.artwork || undefined,
    lyrics: dbTrack.lyrics ? JSON.parse(dbTrack.lyrics) : undefined,
    fileHash: dbTrack.fileHash || undefined,
    scanTime: dbTrack.scanTime || undefined,
    isDeleted: Boolean(dbTrack.isDeleted),
    playCount: dbTrack.playCount || 0,
    lastPlayedAt: dbTrack.lastPlayedAt || undefined,
    year: dbTrack.year || undefined,
    filename: dbTrack.filename || undefined,
    dateAdded: dbTrack.dateAdded || undefined,
    isFavorite: Boolean(dbTrack.isFavorite),
    discNumber: dbTrack.discNumber || undefined,
    trackNumber: dbTrack.trackNumber || undefined,
    genre: dbTrack.genres?.[0]?.genre?.name,
});

export const transformDBAlbumToAlbum = (dbAlbum: DBAlbum): Album => ({
    id: dbAlbum.id,
    title: dbAlbum.title,
    artist: dbAlbum.artist?.name || "Unknown Artist",
    albumArtist: dbAlbum.artist?.name,
    image: dbAlbum.artwork || undefined,
    trackCount: dbAlbum.trackCount || 0,
    year: dbAlbum.year || 0,
    dateAdded: dbAlbum.createdAt,
});

export const transformDBArtistToArtist = (dbArtist: DBArtist): Artist => ({
    id: dbArtist.id,
    name: dbArtist.name,
    trackCount: dbArtist.trackCount || 0,
    image: dbArtist.artwork || undefined,
    dateAdded: dbArtist.createdAt,
});
