import { ScrollView, View } from "react-native"
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
}: LibraryGenresSectionProps) {
  return (
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
  )
}
