import type { Track } from "@/modules/player/types"

export interface PlaylistTrackRowProps {
  track: Track
  isSelected: boolean
  onPress: () => void
}

export interface SheetSearchInputProps {
  inputKey: number
  searchQuery: string
  setSearchQuery: (text: string) => void
}

export interface TrackPickerSheetContentProps {
  inputKey: number
  searchQuery: string
  setSearchQuery: (text: string) => void
  filteredTracks: Track[]
  selectedTracks: Set<string>
  onToggleTrack: (trackId: string) => void
  onApply: () => void
  onClearSelection: () => void
}

export interface PlaylistFormProps {
  name: string
  description: string
  selectedTracksList: Track[]
  setName: (value: string) => void
  setDescription: (value: string) => void
  toggleTrack: (trackId: string) => void
  reorderSelectedTracks: (from: number, to: number) => void
  openTrackSheet: () => void
}
