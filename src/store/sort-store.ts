import { atom } from 'nanostores';
import { Track } from './player-store';

export type SongSortField = 'title' | 'artist' | 'album' | 'year' | 'dateAdded' | 'filename' | 'playCount';
export type AlbumSortField = 'title' | 'artist' | 'year' | 'dateAdded' | 'trackCount';
export type ArtistSortField = 'name' | 'dateAdded' | 'trackCount';
export type PlaylistSortField = 'name' | 'dateAdded' | 'trackCount';

export type SortField = SongSortField | AlbumSortField | ArtistSortField | PlaylistSortField;
export type SortOrder = 'asc' | 'desc';
export type TabName = 'Songs' | 'Albums' | 'Artists' | 'Playlists' | 'Folders' | 'Favorites' | 'ArtistSongs' | 'ArtistAlbums' | 'AlbumSongs';

export interface SortConfig {
    field: SortField;
    order: SortOrder;
}

export const $sortConfig = atom<Record<TabName, SortConfig>>({
    Songs: { field: 'dateAdded', order: 'desc' },
    Albums: { field: 'title', order: 'asc' },
    Artists: { field: 'name', order: 'asc' },
    Playlists: { field: 'name', order: 'asc' },
    Folders: { field: 'name', order: 'asc' },
    Favorites: { field: 'dateAdded', order: 'desc' },
    ArtistSongs: { field: 'playCount', order: 'desc' },
    ArtistAlbums: { field: 'year', order: 'desc' },
    AlbumSongs: { field: 'title', order: 'asc' },
});

export const setSortConfig = (tab: TabName, field: SortField, order?: SortOrder) => {
    const current = $sortConfig.get()[tab];
    if (current.field === field && !order) {
        $sortConfig.set({
            ...$sortConfig.get(),
            [tab]: { field, order: current.order === 'asc' ? 'desc' : 'asc' }
        });
    } else {
        $sortConfig.set({
            ...$sortConfig.get(),
            [tab]: { field, order: order || 'asc' }
        });
    }
};

export const SONG_SORT_OPTIONS: { label: string; field: SongSortField }[] = [
    { label: 'Title', field: 'title' },
    { label: 'Artist', field: 'artist' },
    { label: 'Album', field: 'album' },
    { label: 'Year', field: 'year' },
    { label: 'Play Count', field: 'playCount' },
    { label: 'Date Added', field: 'dateAdded' },
    { label: 'Filename', field: 'filename' },
];

export const ALBUM_SORT_OPTIONS: { label: string; field: AlbumSortField }[] = [
    { label: 'Title', field: 'title' },
    { label: 'Artist', field: 'artist' },
    { label: 'Year', field: 'year' },
    { label: 'Date Added', field: 'dateAdded' },
    { label: 'Number of Tracks', field: 'trackCount' },
];

export const ARTIST_SORT_OPTIONS: { label: string; field: ArtistSortField }[] = [
    { label: 'Name', field: 'name' },
    { label: 'Date Added', field: 'dateAdded' },
    { label: 'Number of Tracks', field: 'trackCount' },
];

export const PLAYLIST_SORT_OPTIONS: { label: string; field: PlaylistSortField }[] = [
    { label: 'Name', field: 'name' },
    { label: 'Date Added', field: 'dateAdded' },
    { label: 'Number of Tracks', field: 'trackCount' },
];

const compareValues = (a: any, b: any, order: SortOrder) => {
    if (a === b) return 0;
    if (a === undefined || a === null) return 1;
    if (b === undefined || b === null) return -1;

    if (typeof a === 'string' && typeof b === 'string') {
        return order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    }

    if (a < b) return order === 'asc' ? -1 : 1;
    if (a > b) return order === 'asc' ? 1 : -1;
    return 0;
};

export const sortTracks = (tracks: Track[], config: SortConfig): Track[] => {
    const { field, order } = config;
    return [...tracks].sort((a, b) => {
        let aVal: any = a[field as keyof Track];
        let bVal: any = b[field as keyof Track];

        if (field === 'filename') {
            aVal = a.filename || a.uri.split('/').pop();
            bVal = b.filename || b.uri.split('/').pop();
        } else if (field === 'title') {
            aVal = (a.title || a.filename || '').toLowerCase();
            bVal = (b.title || b.filename || '').toLowerCase();
        } else if (field === 'artist') {
            aVal = (a.artist || 'Unknown Artist').toLowerCase();
            bVal = (b.artist || 'Unknown Artist').toLowerCase();
        } else if (field === 'album') {
            aVal = (a.album || 'Unknown Album').toLowerCase();
            bVal = (b.album || 'Unknown Album').toLowerCase();
        }

        const primaryResult = compareValues(aVal, bVal, order);
        if (field === 'playCount' && primaryResult === 0) {
            return compareValues(a.lastPlayedAt || 0, b.lastPlayedAt || 0, 'desc');
        }
        
        return primaryResult;
    });
};

export const sortAlbums = (albums: any[], config: SortConfig): any[] => {
    const { field, order } = config;
    return [...albums].sort((a, b) => {
        const aVal = field in a ? a[field] : undefined;
        const bVal = field in b ? b[field] : undefined;

        if (field === 'title' || field === 'artist') {
            return compareValues(
                (aVal || '').toString().toLowerCase(),
                (bVal || '').toString().toLowerCase(),
                order
            );
        }

        return compareValues(aVal, bVal, order);
    });
};

export const sortArtists = (artists: any[], config: SortConfig): any[] => {
    const { field, order } = config;
    return [...artists].sort((a, b) => {
        const aVal = field in a ? a[field] : undefined;
        const bVal = field in b ? b[field] : undefined;

        if (field === 'name') {
            return compareValues(
                (aVal || '').toString().toLowerCase(),
                (bVal || '').toString().toLowerCase(),
                order
            );
        }

        return compareValues(aVal, bVal, order);
    });
};

export const sortGeneric = (items: any[], config: SortConfig): any[] => {
    return sortAlbums(items, config);
};
