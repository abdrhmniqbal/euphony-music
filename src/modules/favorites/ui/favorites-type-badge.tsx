import type { FavoriteType } from "@/modules/favorites/types"
import { Chip } from "heroui-native"
import { useTranslation } from "react-i18next"

export const TypeBadge: React.FC<{ type: FavoriteType }> = ({ type }) => {
  const { t } = useTranslation()
  const label = (() => {
    switch (type) {
      case "track":
        return t("library.favoriteType.track")
      case "artist":
        return t("library.favoriteType.artist")
      case "album":
        return t("library.favoriteType.album")
      case "playlist":
        return t("library.favoriteType.playlist")
      default:
        return type
    }
  })()

  return (
    <Chip size="sm" variant="secondary" color="default" className="mr-2">
      <Chip.Label>{label}</Chip.Label>
    </Chip>
  )
}
