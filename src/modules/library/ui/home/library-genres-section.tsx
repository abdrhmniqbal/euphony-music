import * as React from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import { EmptyState } from "@/components/ui/empty-state"
import { GenreCard } from "@/components/patterns/genre-card"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import type { GenreCategory } from "@/modules/genres/types"

interface LibraryGenresSectionProps {
  genres: GenreCategory[]
  listContentContainerStyle: { paddingBottom: number }
  refreshControl: React.ReactElement<any>
  sharedListEvents: {
    onScroll: (event: any) => void
    onScrollBeginDrag: () => void
    onScrollEndDrag: () => void
    onMomentumScrollEnd: () => void
  }
  mutedColor: string
  genresEmptyTitle: string
  genresEmptyMessage: string
  onGenrePress: (genreName: string) => void
  onGenreLongPress?: (genreName: string) => void
}

export function LibraryGenresSection({
  genres,
  listContentContainerStyle,
  refreshControl,
  sharedListEvents,
  mutedColor,
  genresEmptyTitle,
  genresEmptyMessage,
  onGenrePress,
  onGenreLongPress,
}: LibraryGenresSectionProps) {
  const { t } = useTranslation()
  const [selectedGenre, setSelectedGenre] = React.useState<GenreCategory | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)

  const handleLongPress = (genre: GenreCategory) => {
    setSelectedGenre(genre)
    setIsSheetOpen(true)
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
  }

  return (
    <>
    <ScrollView
      className="flex-1"
      contentContainerStyle={listContentContainerStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={refreshControl}
      {...sharedListEvents}
    >
      {genres.length > 0 ? (
        <View className="flex-row flex-wrap justify-between gap-y-4">
          {genres.map((genre) => (
            <GenreCard
              key={genre.id}
              title={genre.title}
              trackCount={genre.trackCount}
              color={genre.color}
              pattern={genre.pattern}
              onPress={() => onGenrePress(genre.title)}
              onLongPress={() => handleLongPress(genre)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon={<LocalMusicNoteSolidIcon fill="none" width={48} height={48} color={mutedColor} />}
          title={genresEmptyTitle}
          message={genresEmptyMessage}
          className="mt-8"
        />
      )}
    </ScrollView>
    <CollectionActionSheet
        visible={isSheetOpen && Boolean(selectedGenre)}
        onOpenChange={(open) => {
          if (!open) {
            closeSheet()
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
