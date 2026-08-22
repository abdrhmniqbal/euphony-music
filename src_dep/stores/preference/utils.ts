/**
 * Purpose: Provides preference utility helpers copied from reference store flow.
 * Caller: Preference store initialization and actions.
 * Dependencies: React Native i18n manager and Startune i18n instance.
 * Main Functions: resolveLanguageConfigs(), clampMinAlbumLength(), clampPlaybackDelay().
 * Side Effects: Updates i18next language and React Native RTL config.
 */

import { I18nManager } from "react-native"

import { i18n } from "@/modules/localization/i18n"
import { clamp } from "@/utils/number"

export async function resolveLanguageConfigs(language: string, forceLTR: boolean) {
  await i18n.changeLanguage(language)
  I18nManager.allowRTL(forceLTR ? false : i18n.dir() === "rtl")
  I18nManager.forceRTL(forceLTR ? false : i18n.dir() === "rtl")
}

export function clampMinAlbumLength(value: number) {
  return clamp(1, value, 20)
}

export function clampPlaybackDelay(value: number) {
  return clamp(0, value, 10)
}
