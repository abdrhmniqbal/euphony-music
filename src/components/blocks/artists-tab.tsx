import React from "react";
import { ArtistGrid, Artist } from "@/components/blocks/artist-grid";
import { LibrarySkeleton } from "@/components/blocks/library-skeleton";
import { EmptyState } from "@/components/ui";
import { useArtists } from "@/modules/library/library.queries";
import { SortConfig } from "@/modules/library/library-sort.store";

interface ArtistsTabProps {
    onArtistPress?: (artist: Artist) => void;
    sortConfig?: SortConfig;
}

export const ArtistsTab: React.FC<ArtistsTabProps> = ({ onArtistPress, sortConfig }) => {
    const orderByField = sortConfig?.field || 'name';
    const order = sortConfig?.order || 'asc';

    const { data: artistsData, isLoading, isPending } = useArtists(orderByField as any, order);

    const artists: Artist[] = artistsData?.map(artist => ({
        id: artist.id,
        name: artist.name,
        trackCount: artist.trackCount || 0,
        image: artist.artwork || artist.albumArtwork || undefined,
        dateAdded: 0,
    })) || [];

    const handleArtistPress = (artist: Artist) => {
        onArtistPress?.(artist);
    };

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

    return <ArtistGrid data={artists} onArtistPress={handleArtistPress} scrollEnabled={false} />;
};
