import { I18nManager } from "react-native"

import { i18n } from "@/core/localization/i18n"
import type { ThemeMode } from "./types"

export async function applyStartupPreferences(state: {
  themeMode: ThemeMode
  language: string
  forceLTR: boolean
}) {
  // Theme application is owned solely by ThemeRuntime (reactive on themeId/themeMode); setting the
  // bare mode here races it and resets uniwind to the default theme on some launches.
  await resolveLanguageConfigs(state.language, state.forceLTR)
}

async function resolveLanguageConfigs(language: string, forceLTR: boolean) {
  await i18n.changeLanguage(language)
  const rtl = !forceLTR && i18n.dir() === "rtl"
  I18nManager.allowRTL(rtl)
  I18nManager.forceRTL(rtl)
}
