export interface IndexerScanProgress {
  phase: "scanning" | "processing" | "complete"
  current: number
  total: number
  currentFile: string
}
