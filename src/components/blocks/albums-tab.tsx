import React from "react";
import { AlbumGrid, Album } from "@/components/blocks/album-grid";
import { LibrarySkeleton } from "@/components/blocks/library-skeleton";
import { EmptyState } from "@/components/ui";
import { useAlbums } from "@/modules/library/library.queries";
import { SortConfig } from "@/modules/library/library-sort.store";

interface AlbumsTabProps {
    onAlbumPress?: (album: Album) => void;
    sortConfig?: SortConfig;
}

export const AlbumsTab: React.FC<AlbumsTabProps> = ({ onAlbumPress, sortConfig }) => {
    const orderByField = sortConfig?.field === 'artist' ? 'title' : (sortConfig?.field || 'title');
    const order = sortConfig?.order || 'asc';

    const { data: albumsData, isLoading, isPending } = useAlbums(orderByField as any, order);

    const albums: Album[] = albumsData?.map(album => ({
        id: album.id,
        title: album.title,
        artist: album.artist?.name || 'Unknown Artist',
        albumArtist: album.artist?.name,
        image: album.artwork || undefined,
        trackCount: album.trackCount || 0,
        year: album.year || 0,
        dateAdded: 0,
    })) || [];

    const handleAlbumPress = (album: Album) => {
        onAlbumPress?.(album);
    };

    if (isLoading || isPending) {
        return <LibrarySkeleton type="albums" />;
    }

    if (albums.length === 0) {
        return <EmptyState
            icon="disc"
            title="No Albums"
            message="Albums you add to your library will appear here."
        />;
    }

    return <AlbumGrid data={albums} onAlbumPress={handleAlbumPress} scrollEnabled={false} />;
};
