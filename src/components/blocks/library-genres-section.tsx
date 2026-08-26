import { useThemeColor } from "heroui-native"

/* oxlint-disable anti-slop/no-shape-in-symbol-names -- genre/mix visual shape is domain vocabulary */
import * as React from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, View } from "react-native"

import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import { GenreCard } from "@/components/patterns/genre-card"
import { LibraryListHeader } from "@/components/blocks/library-list-header"
import { SortSheet } from "@/components/blocks/sort-sheet"
import { NAME_TRACK_COUNT_SORT_OPTIONS, resolveSortLabel } from "@/domains/library/sort-constants"
import { setSortConfig, useLibrarySortStore } from "@/domains/library/sort-store"
import { EmptyState } from "@/components/ui/empty-state"
import { useGenres, type GenreListItem } from "@/domains/genres/queries"

interface LibraryGenresSectionProps {
  contentBottomPadding: number
  onGenrePress: (genreName: string) => void
}

export function LibraryGenresSection({
  contentBottomPadding,
  onGenrePress,
}: LibraryGenresSectionProps) {
  const muted = useThemeColor("muted")
  const { data: genres = [] } = useGenres()
  const { t } = useTranslation()
  const [selectedGenre, setSelectedGenre] = React.useState<GenreListItem | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [showSortSheet, setShowSortSheet] = React.useState(false)
  const sortConfig = useLibrarySortStore((state) => state.sortConfig.GenresTab)

  const sortedGenres = React.useMemo(() => {
    const entries = [...genres]
    if (sortConfig.field === "trackCount") {
      const direction = sortConfig.order === "asc" ? 1 : -1
      return entries.sort((a, b) => (a.trackCount - b.trackCount) * direction)
    }
    return entries.sort((a, b) =>
      sortConfig.order === "asc"
        ? a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
        : b.title.localeCompare(a.title, undefined, { sensitivity: "base" })
    )
  }, [genres, sortConfig])

  return (
    <SortSheet
      visible={showSortSheet}
      onOpenChange={setShowSortSheet}
      currentField={sortConfig.field}
      currentOrder={sortConfig.order}
      onSelect={(field, order) => setSortConfig("GenresTab", field, order)}
    >
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: contentBottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        {sortedGenres.length > 0 ? (
          <LibraryListHeader
            count={sortedGenres.length}
            className="mt-4 mb-0"
            sortLabel={t(
              resolveSortLabel(NAME_TRACK_COUNT_SORT_OPTIONS, sortConfig.field) || "library.sortBy"
            )}
          />
        ) : null}
        {sortedGenres.length > 0 ? (
          <View className="mt-4 flex-row flex-wrap justify-between gap-y-4">
            {sortedGenres.map((genre) => (
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
            icon={<LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={muted} />}
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
      <SortSheet.Content options={NAME_TRACK_COUNT_SORT_OPTIONS} />
    </SortSheet>
  )
}

export default LibraryGenresSection
