import { atom } from 'nanostores';
import { useStore } from '@nanostores/react';
import { queryClient } from '@/lib/tanstack-query';
import type { FavoriteEntry, FavoriteType } from '@/modules/favorites/favorites.api';
import {
    addFavorite,
    removeFavorite,
    isFavorite as isFavoriteDB,
    getFavorites,
} from '@/modules/favorites/favorites.api';

// Re-export types for backwards compatibility
export type { FavoriteEntry, FavoriteType };
export { toggleFavoriteDB } from '@/modules/favorites/favorites.api';

// Store for all favorites
export const $favorites = atom<FavoriteEntry[]>([]);

const invalidateFavoriteQueries = async () => {
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['favorites'] }),
        queryClient.invalidateQueries({ queryKey: ['library', 'favorites'] }),
        queryClient.invalidateQueries({ queryKey: ['tracks'] }),
        queryClient.invalidateQueries({ queryKey: ['library', 'tracks'] }),
        queryClient.invalidateQueries({ queryKey: ['artists'] }),
        queryClient.invalidateQueries({ queryKey: ['albums'] }),
        queryClient.invalidateQueries({ queryKey: ['playlists'] }),
    ]);
};

// Load favorites from database
export const loadFavorites = async () => {
    const favorites = await getFavorites();
    $favorites.set(favorites);
};

// Toggle favorite status for any item type
export const toggleFavoriteItem = async (
    id: string,
    type: FavoriteType,
    name: string,
    subtitle?: string,
    image?: string
) => {
    const currentFavorites = $favorites.get();
    const existingIndex = currentFavorites.findIndex(f => f.id === id && f.type === type);
    
    if (existingIndex >= 0) {
        // Remove from favorites
        await removeFavorite(id, type);
        const newFavorites = currentFavorites.filter(f => !(f.id === id && f.type === type));
        $favorites.set(newFavorites);
        await invalidateFavoriteQueries();
        return false;
    } else {
        // Add to favorites
        const entry: FavoriteEntry = {
            id,
            type,
            name,
            subtitle,
            image,
            dateAdded: Date.now()
        };
        await addFavorite(entry);
        const newFavorites = [entry, ...currentFavorites];
        // Re-sort by dateAdded
        newFavorites.sort((a, b) => b.dateAdded - a.dateAdded);
        $favorites.set(newFavorites);
        await invalidateFavoriteQueries();
        return true;
    }
};

// Check if an item is favorited
export const checkIsFavorite = async (id: string, type: FavoriteType = 'track'): Promise<boolean> => {
    return isFavoriteDB(id, type);
};

// Get favorites by type
export const getFavoritesByType = (type: FavoriteType): FavoriteEntry[] => {
    return $favorites.get().filter(f => f.type === type);
};

// Hook to use favorites
export const useFavorites = () => {
    return useStore($favorites);
};

// Hook to check if specific item is favorite
export const useIsFavorite = (id: string, type: FavoriteType = 'track') => {
    const favorites = useStore($favorites);
    return favorites.some(f => f.id === id && f.type === type);
};
