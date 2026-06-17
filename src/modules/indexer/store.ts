import { create } from "zustand"

export interface IndexerState {
  isIndexing: boolean
  progress: number
  currentFile: string
  totalFiles: number
  processedFiles: number
  phase: "idle" | "scanning" | "processing" | "cleanup" | "complete" | "paused"
  showProgress: boolean
}

const DEFAULT_INDEXER_STATE: IndexerState = {
  isIndexing: false,
  progress: 0,
  currentFile: "",
  totalFiles: 0,
  processedFiles: 0,
  phase: "idle",
  showProgress: false,
}

interface IndexerStoreState {
  indexerState: IndexerState
}

export const useIndexerStore = create<IndexerStoreState>(() => ({
  indexerState: DEFAULT_INDEXER_STATE,
}))

export function getDefaultIndexerState() {
  return DEFAULT_INDEXER_STATE
}

export function getIndexerState() {
  return useIndexerStore.getState().indexerState
}

export function setIndexerState(value: IndexerState) {
  useIndexerStore.setState({ indexerState: value })
}

export function updateIndexerState(updates: Partial<IndexerState>) {
  setIndexerState({ ...getIndexerState(), ...updates })
}
