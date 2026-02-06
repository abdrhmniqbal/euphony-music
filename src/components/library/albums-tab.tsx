import React from "react";
import { AlbumGrid, Album } from "@/components/library/album-grid";
import { LibrarySkeleton } from "@/components/library/library-skeleton";
import { EmptyState } from "@/components/empty-state";
import { useAlbums } from "@/features/library/api/use-library";
import { SortConfig } from "@/features/library/library-sort.store";

interface AlbumsTabProps {
    onAlbumPress?: (album: Album) => void;
    sortConfig?: SortConfig;
}

export const AlbumsTab: React.FC<AlbumsTabProps> = ({ onAlbumPress, sortConfig }) => {
    // Use database-level sorting - much faster than client-side
    const orderByField = sortConfig?.field === 'artist' ? 'title' : (sortConfig?.field || 'title');
    const order = sortConfig?.order || 'asc';

    const { data: albumsData, isLoading, isPending } = useAlbums(orderByField as any, order);

    // Transform data to match Album interface (no sorting needed - already sorted by DB)
    const albums: Album[] = albumsData?.map(album => ({
        id: album.id,
        title: album.title,
        artist: album.artist?.name || 'Unknown Artist',
        albumArtist: album.artist?.name,
        image: album.artwork || undefined,
        trackCount: album.trackCount || 0,
        year: album.year || 0,
        dateAdded: 0, // Not available from this query
    })) || [];

    const handleAlbumPress = (album: Album) => {
        onAlbumPress?.(album);
    };

    // Show skeleton while loading
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

    // Render grid with data from React Query (already sorted by database)
    return <AlbumGrid data={albums} onAlbumPress={handleAlbumPress} scrollEnabled={false} />;
};
