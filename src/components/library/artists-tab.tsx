import React from "react";
import { ArtistGrid, Artist } from "@/components/library/artist-grid";
import { LibrarySkeleton } from "@/components/library/library-skeleton";
import { EmptyState } from "@/components/empty-state";
import { useArtists } from "@/features/library/api/use-library";
import { SortConfig } from "@/store/sort-store";

interface ArtistsTabProps {
    onArtistPress?: (artist: Artist) => void;
    sortConfig?: SortConfig;
}

export const ArtistsTab = React.memo(({ onArtistPress, sortConfig }: ArtistsTabProps) => {
    // Use database-level sorting - much faster than client-side
    const orderByField = sortConfig?.field || 'name';
    const order = sortConfig?.order || 'asc';

    const { data: artistsData, isLoading, isPending } = useArtists(orderByField as any, order);

    // Transform data to match Artist interface (no sorting needed - already sorted by DB)
    const artists: Artist[] = artistsData?.map(artist => ({
        id: artist.id,
        name: artist.name,
        trackCount: artist.trackCount || 0,
        image: artist.artwork || artist.albumArtwork || undefined,
        dateAdded: 0, // Not available from this query
    })) || [];

    const handleArtistPress = (artist: Artist) => {
        onArtistPress?.(artist);
    };

    // Show skeleton while loading
    if (isLoading || isPending) {
        return <LibrarySkeleton type="artists" />;
    }

    if (artists.length === 0) {
        return <EmptyState
            icon="people"
            title="No Artists"
            message="Artists from your music library will appear here."
        />;
    }

    // Render grid with data from React Query (already sorted by database)
    return <ArtistGrid data={artists} onArtistPress={handleArtistPress} scrollEnabled={false} />;
});

ArtistsTab.displayName = 'ArtistsTab';
