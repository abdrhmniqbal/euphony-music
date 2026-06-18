# Metadata & Lyrics Parsing
This module extracts structural metadata, embedded lyrics, and artwork from local media files.

## Edge Vectors & Validation Bounds
Since binary parsing is unsafe and reliant on untrusted media, specific defensive edge vectors are considered:

1. **ID3 Parsing (`id3-lyrics.ts`)**
   - **Malformed Headers:** Rejects tags with size `0` or invalid headers `!= 0x49 0x44 0x33`.
   - **Out-of-Bounds Frames:** Safely breaks loop if frame size exceeds the actual tag boundaries, preventing range errors.
   - **Text Encodings:** Normalizes fallback encodings (UTF-8, UTF-16, UTF-16BE). Fails gracefully to empty string if decoding throws.
   - **Malformed UTF-16:** Handled by `stripMalformedUtf16LyricsPrefix`, ensuring stray unicode bytes don't corrupt UI rendering.

2. **MP4 Atom Parsing (`mp4-lyrics.ts`)**
   - **Negative Sizes:** Integer decode bounds ensure `size < 8` instantly breaks out of recursive atom parsing to prevent infinite loops.
   - **Deep Recursion Limits:** Safely recursively traverses `moov`, `udta`, `meta`, and `ilst` containers to find lyric tracks.

3. **Artwork Caching (`artwork-cache.repository.ts`)**
   - **MIME Fallback:** Gracefully defaults to `image/jpeg` if base64 scheme prefixes are stripped or invalid.
   - **Atomic Reads:** Hashes raw payload to prevent cache conflicts for visually identical images.
   - **Orphan Cleanup:** Checks database references prior to disk unlink, preventing deletion of shared album/artist artwork during transient scans.
