/**
 * Purpose: Loads, sanitizes, and persists audio crossfade settings.
 * Caller: Audio settings screen and bootstrap settings preload.
 * Dependencies: Settings repository and settings store.
 * Main Functions: ensureCrossfadeConfigLoaded(), setCrossfadeConfig(), getCrossfadeDurationLabel().
 * Side Effects: Reads and writes `audio-crossfade.json` in Expo document storage and mutates settings state.
 */

import type { CrossfadeConfig } from "@/modules/settings/types"
import { createSettingsModule } from "@/modules/settings/factory"
import { getDefaultCrossfadeConfig } from "@/modules/settings/store"

export type { CrossfadeConfig }

const MIN_CROSSFADE_SECONDS = 1
const MAX_CROSSFADE_SECONDS = 12

function clampDurationSeconds(value: number): number {
  if (!Number.isFinite(value)) {
    return getDefaultCrossfadeConfig().durationSeconds
  }

  return Math.max(MIN_CROSSFADE_SECONDS, Math.min(MAX_CROSSFADE_SECONDS, Math.round(value)))
}

function sanitizeConfig(config: unknown): CrossfadeConfig {
  const source = config && typeof config === "object" ? (config as Record<string, unknown>) : {}

  return {
    isEnabled:
      typeof source.isEnabled === "boolean"
        ? source.isEnabled
        : getDefaultCrossfadeConfig().isEnabled,
    durationSeconds: clampDurationSeconds(
      (typeof source.durationSeconds === "number" ? source.durationSeconds : undefined) ??
        getDefaultCrossfadeConfig().durationSeconds
    ),
  }
}

const mod = createSettingsModule<CrossfadeConfig>({
  fileName: "audio-crossfade.json",
  stateKey: "crossfadeConfig",
  getDefault: getDefaultCrossfadeConfig,
  sanitize: sanitizeConfig,
})

export const ensureCrossfadeConfigLoaded = mod.ensureLoaded
export const setCrossfadeConfig = mod.set


