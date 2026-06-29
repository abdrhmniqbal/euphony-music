import type { ReactFormExtendedApi } from "@tanstack/react-form"

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

type PlaylistFormData = {
  name: string
  description: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PlaylistFormApi = ReactFormExtendedApi<PlaylistFormData, any, any, any, any, any, any, any, any, any, any, any>

export interface PlaylistFormProps {
  form: PlaylistFormApi
  selectedTracksList: Track[]
  toggleTrack: (trackId: string) => void
  reorderSelectedTracks: (from: number, to: number) => void
  openTrackSheet: () => void
}
