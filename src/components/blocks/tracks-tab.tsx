import React from "react";
import { TrackList } from "@/components/blocks/track-list";
import { LibrarySkeleton } from "@/components/blocks/library-skeleton";
import { EmptyState } from "@/components/ui";
import { useTracks } from "@/modules/tracks/tracks.queries";
import { Track } from "@/modules/player/player.store";
import { SortConfig } from "@/modules/library/library-sort.store";
import { transformDBTrackToTrack } from "@/utils/transformers";
import type { DBTrack } from "@/types/database";

interface TracksTabProps {
    onTrackPress?: (track: Track) => void;
    sortConfig?: SortConfig;
}

export const TracksTab: React.FC<TracksTabProps> = ({ onTrackPress, sortConfig }) => {
    const orderByField = sortConfig?.field === 'filename' ? 'title' : (sortConfig?.field || 'title');
    const order = sortConfig?.order || 'asc';

    const { data: dbTracks = [], isLoading, isPending } = useTracks({
        sortBy: orderByField as any,
        sortOrder: order,
    });

    const tracks = (dbTracks as DBTrack[]).map(transformDBTrackToTrack);

    const handleTrackPress = (track: Track) => {
        onTrackPress?.(track);
    };

    if (isLoading || isPending) {
        return <LibrarySkeleton type="tracks" />;
    }

    if (tracks.length === 0) {
        return <EmptyState
            icon="musical-note"
            title="No Tracks"
            message="Tracks you add to your library will appear here."
        />;
    }

    return <TrackList data={tracks} onTrackPress={handleTrackPress} scrollEnabled={false} />;
};
