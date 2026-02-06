import React from "react";
import { SongList } from "@/components/library/song-list";
import { LibrarySkeleton } from "@/components/library/library-skeleton";
import { EmptyState } from "@/components/empty-state";
import { useTracks } from "@/features/library/api/use-library";
import { Track } from "@/features/player/player.store";
import { SortConfig } from "@/features/library/library-sort.store";
import { transformDBTrackToTrack } from "@/utils/transformers";
import type { DBTrack } from "@/types/database";

interface SongsTabProps {
    onSongPress?: (track: Track) => void;
    sortConfig?: SortConfig;
}

export const SongsTab: React.FC<SongsTabProps> = ({ onSongPress, sortConfig }) => {
    const orderByField = sortConfig?.field === 'filename' ? 'title' : (sortConfig?.field || 'title');
    const order = sortConfig?.order || 'asc';

    const { data: dbTracks = [], isLoading, isPending } = useTracks({
        sortBy: orderByField as any,
        sortOrder: order,
    });

    const tracks = (dbTracks as DBTrack[]).map(transformDBTrackToTrack);

    const handleSongPress = (track: Track) => {
        onSongPress?.(track);
    };

    if (isLoading || isPending) {
        return <LibrarySkeleton type="songs" />;
    }

    if (tracks.length === 0) {
        return <EmptyState
            icon="musical-note"
            title="No Songs"
            message="Songs you add to your library will appear here."
        />;
    }

    return <SongList data={tracks} onSongPress={handleSongPress} scrollEnabled={false} />;
};
