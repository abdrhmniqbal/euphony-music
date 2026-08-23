import * as React from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, View } from "react-native"

import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import { GenreCard } from "@/components/patterns/genre-card"
import { EmptyState } from "@/components/ui/empty-state"
import { useThemeColors } from "@/core/theme/use-theme-colors"
import { useGenres, type GenreListItem } from "@/domains/genres/queries"

interface LibraryGenresSectionProps {
  contentBottomPadding: number
  onGenrePress: (genreName: string) => void
}

export function LibraryGenresSection({ contentBottomPadding, onGenrePress }: LibraryGenresSectionProps) {
  const theme = useThemeColors()
  const { data: genres = [] } = useGenres()
  const { t } = useTranslation()
  const [selectedGenre, setSelectedGenre] = React.useState<GenreListItem | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)

  return (
    <>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: contentBottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        {genres.length > 0 ? (
          <View className="mt-4 flex-row flex-wrap justify-between gap-y-4">
            {genres.map((genre) => (
              <GenreCard
                key={genre.id}
                title={genre.title}
                trackCount={genre.trackCount}
                color={genre.color}
                pattern={genre.shape}
                onPress={() => onGenrePress(genre.title)}
                onLongPress={() => {
                  setSelectedGenre(genre)
                  setIsSheetOpen(true)
                }}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={
              <LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={theme.muted} />
            }
            title={t("library.empty.genresFoundTitle")}
            message={t("library.empty.genresFoundMessage")}
            className="mt-8"
          />
        )}
      </ScrollView>
      <CollectionActionSheet
        visible={isSheetOpen && Boolean(selectedGenre)}
        onOpenChange={(open) => {
          if (!open) {
            setIsSheetOpen(false)
          }
        }}
        type="genre"
        id={selectedGenre?.title ?? ""}
        name={selectedGenre?.title ?? ""}
        subtitle={t("library.genre")}
        trackCount={selectedGenre?.trackCount ?? 0}
        hideFavoriteAction
      />
    </>
  )
}

export default LibraryGenresSection
