/**
 * Purpose: Normalizes and parses static, synced, timestamp-tagged, and timed-markup lyric text.
 * Caller: Lyrics source resolver and player lyrics view.
 * Dependencies: plain-text, lrc-parser, timed-markup-parser, and timing.
 * Main Functions: normalizeLyricsText(), splitLyricsLines(), parseSyncedLyricsLines(), parseTimedMarkupLines(), parseTTMLLines(), hasMeaningfulTimedMarkupTiming(), hasMeaningfulTTMLTiming()
 * Side Effects: None.
 */

export * from "./plain-text"
export * from "./lrc-parser"
export * from "./timed-markup-parser"
export * from "./timing"
