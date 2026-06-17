import { startIndexing } from "@/modules/indexer/service"
import { setScanningProgress } from "../progress"

export async function findAndSaveAudio() {
  setScanningProgress({ status: "in-progress", error: null })
  await startIndexing(false, true)
  setScanningProgress({ status: "complete", error: null })
  return { foundFiles: [], unstagedFiles: [] }
}
