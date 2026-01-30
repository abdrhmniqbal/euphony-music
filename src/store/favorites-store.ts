import { atom } from 'nanostores';
import { useStore } from '@nanostores/react';
import { 
    FavoriteEntry, 
    FavoriteType, 
    addFavorite, 
    removeFavorite, 
    isFavorite as isFavoriteDB,
    getFavorites 
} from '@/utils/database';

// Store for all favorites
export const $favorites = atom<FavoriteEntry[]>([]);

// Load favorites from database
export const loadFavorites = () => {
    const favorites = getFavorites();
    $favorites.set(favorites);
};

// Toggle favorite status for any item type
export const toggleFavoriteItem = (
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
        removeFavorite(id);
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
        addFavorite(entry);
        $favorites.set([entry, ...currentFavorites]);
        return true;
    }
};

// Check if an item is favorited
export const checkIsFavorite = (id: string): boolean => {
    return isFavoriteDB(id);
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
export const useIsFavorite = (id: string) => {
    const favorites = useStore($favorites);
    return favorites.some(f => f.id === id);
};
