export function getArtistsString(artists: string[] | null | undefined) {
  return artists?.filter(Boolean).join(", ") || "Unknown Artist"
}
