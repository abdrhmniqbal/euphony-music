/**
 * Purpose: Loads, sanitizes, and persists audio playback behavior settings.
 * Caller: Audio settings screen, bootstrap settings preload, and player interruption/lifecycle services.
 * Dependencies: Settings repository and settings store.
 * Main Functions: ensureAudioPlaybackConfigLoaded(), setAudioPlaybackConfig()
 * Side Effects: Reads and writes `audio-playback.json` in Expo document storage and mutates settings state.
 */

import type { AudioPlaybackConfig } from "@/modules/settings/types"
import { createSettingsModule } from "@/modules/settings/factory"
import { getDefaultAudioPlaybackConfig } from "@/modules/settings/store"

export type { AudioPlaybackConfig }

function sanitizeBoolean(source: Record<string, unknown>, key: keyof AudioPlaybackConfig) {
  const value = source[key]
  return typeof value === "boolean" ? value : getDefaultAudioPlaybackConfig()[key]
}

function sanitizeConfig(config: unknown): AudioPlaybackConfig {
  const source = config && typeof config === "object" ? (config as Record<string, unknown>) : {}

  return {
    fadePlayPauseStop: sanitizeBoolean(source, "fadePlayPauseStop"),
    fadeOnSeek: sanitizeBoolean(source, "fadeOnSeek"),
    resumeAfterCall: sanitizeBoolean(source, "resumeAfterCall"),
    resumeOnStart: sanitizeBoolean(source, "resumeOnStart"),
    resumeOnReopen: sanitizeBoolean(source, "resumeOnReopen"),
    shortAudioFocusChange: sanitizeBoolean(source, "shortAudioFocusChange"),
    pauseInCall: sanitizeBoolean(source, "pauseInCall"),
    resumeOnFocusGain: sanitizeBoolean(source, "resumeOnFocusGain"),
    duckVolume: sanitizeBoolean(source, "duckVolume"),
    permanentAudioFocusChange: sanitizeBoolean(source, "permanentAudioFocusChange"),
  }
}

const mod = createSettingsModule<AudioPlaybackConfig>({
  fileName: "audio-playback.json",
  stateKey: "audioPlaybackConfig",
  getDefault: getDefaultAudioPlaybackConfig,
  sanitize: sanitizeConfig,
})

export const ensureAudioPlaybackConfigLoaded = mod.ensureLoaded
export const setAudioPlaybackConfig = mod.set
