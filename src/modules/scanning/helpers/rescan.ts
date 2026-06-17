import { findAndSaveAudio } from "./audio"
import { findAndSaveArtwork } from "./artwork"
import { appCleanUp } from "./cleanup"

export async function rescanLibrary() {
  const result = await findAndSaveAudio()
  await findAndSaveArtwork()
  await appCleanUp.media()
  return result
}
