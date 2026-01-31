import { atom } from 'nanostores';
import { useStore } from '@nanostores/react';
import { 
    FavoriteEntry, 
    FavoriteType, 
    addFavorite, 
    removeFavorite, 
    isFavorite as isFavoriteDB,
    getFavorites 
} from '@/db/operations';

// Re-export types for backwards compatibility
export type { FavoriteEntry, FavoriteType } from '@/db/operations';

// Store for all favorites
export const $favorites = atom<FavoriteEntry[]>([]);

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
    const existingIndex = currentFavorites.findIndex(f => f.id === id);
    
    if (existingIndex >= 0) {
        // Remove from favorites
        const compositeId = `${type}-${id}`;
        await removeFavorite(compositeId);
        const newFavorites = currentFavorites.filter(f => f.id !== id);
        $favorites.set(newFavorites);
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
        $favorites.set([entry, ...currentFavorites]);
        return true;
    }
};

// Check if an item is favorited
export const checkIsFavorite = async (id: string, type: FavoriteType = 'track'): Promise<boolean> => {
    const compositeId = `${type}-${id}`;
    return isFavoriteDB(compositeId);
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