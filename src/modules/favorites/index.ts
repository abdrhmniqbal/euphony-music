export type { FavoriteEntry, FavoriteType } from "./favorites.api"
export {
  addFavorite,
  getFavorites,
  isFavorite,
  removeFavorite,
  toggleFavoriteDB,
} from "./favorites.api"
export {
  useAddFavorite,
  useFavorites,
  useIsFavorite,
  useRemoveFavorite,
  useToggleFavorite,
} from "./favorites.queries"
