import { I18nManager } from "react-native"
import { Uniwind } from "uniwind"

import { i18n } from "@/core/localization/i18n"
import type { ThemeMode } from "./types"

export async function applyStartupPreferences(state: {
  themeMode: ThemeMode
  language: string
  forceLTR: boolean
}) {
  Uniwind.setTheme(state.themeMode)
  await resolveLanguageConfigs(state.language, state.forceLTR)
}

async function resolveLanguageConfigs(language: string, forceLTR: boolean) {
  await i18n.changeLanguage(language)
  const rtl = !forceLTR && i18n.dir() === "rtl"
  I18nManager.allowRTL(rtl)
  I18nManager.forceRTL(rtl)
}
