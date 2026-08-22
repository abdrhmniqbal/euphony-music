/**
 * Purpose: Initializes i18next with app translation resources and locale fallback behavior.
 * Caller: Localization provider and any module that needs translation outside React components.
 * Dependencies: expo-localization, i18next, react-i18next, intl-pluralrules, JSON translation resources.
 * Main Functions: i18n, i18nReady, getDeviceLanguageCode(), isSupportedLanguageCode().
 * Side Effects: Initializes the global i18next instance.
 */

import "intl-pluralrules"

import * as Localization from "expo-localization"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import de from "./resources/de.json"
import en from "./resources/en.json"
import es from "./resources/es.json"
import fr from "./resources/fr.json"
import hi from "./resources/hi.json"
import id from "./resources/id.json"
import it from "./resources/it.json"
import ja from "./resources/ja.json"
import ko from "./resources/ko.json"
import nl from "./resources/nl.json"
import ptBR from "./resources/pt.json"
import ru from "./resources/ru.json"
import zhHans from "./resources/zs.json"
import zhHant from "./resources/zt.json"
import type { LanguageCode } from "./types"

export const DEFAULT_LANGUAGE_CODE: LanguageCode = "en"
export const SUPPORTED_LANGUAGE_CODES: LanguageCode[] = [
  "en",
  "id",
  "hi",
  "zh-Hans",
  "zh-Hant",
  "ja",
  "ru",
  "de",
  "fr",
  "ko",
  "it",
  "es",
  "nl",
  "pt-BR",
]

export function isSupportedLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && SUPPORTED_LANGUAGE_CODES.includes(value as LanguageCode)
}

export function getDeviceLanguageCode(): LanguageCode {
  const locale = Localization.getLocales()[0]
  const languageCode = locale?.languageCode

  if (languageCode === "zh") {
    const localeWithScript = locale as typeof locale & { scriptCode?: string }
    const regionCode = locale.regionCode?.toUpperCase()
    const scriptCode = localeWithScript.scriptCode?.toLowerCase()
    return scriptCode === "hant" || ["HK", "MO", "TW"].includes(regionCode ?? "")
      ? "zh-Hant"
      : "zh-Hans"
  }

  if (languageCode === "pt") {
    return locale.regionCode?.toUpperCase() === "BR" ? "pt-BR" : DEFAULT_LANGUAGE_CODE
  }

  return isSupportedLanguageCode(languageCode) ? languageCode : DEFAULT_LANGUAGE_CODE
}

export const i18nReady = i18n.isInitialized
  ? Promise.resolve(i18n)
  : i18n.use(initReactI18next).init({
      compatibilityJSON: "v4",
      fallbackLng: DEFAULT_LANGUAGE_CODE,
      lng: getDeviceLanguageCode(),
      interpolation: {
        escapeValue: false,
      },
      resources: {
        de: {
          translation: de,
        },
        en: {
          translation: en,
        },
        es: {
          translation: es,
        },
        fr: {
          translation: fr,
        },
        hi: {
          translation: hi,
        },
        id: {
          translation: id,
        },
        it: {
          translation: it,
        },
        ja: {
          translation: ja,
        },
        ko: {
          translation: ko,
        },
        nl: {
          translation: nl,
        },
        "pt-BR": {
          translation: ptBR,
        },
        ru: {
          translation: ru,
        },
        "zh-Hans": {
          translation: zhHans,
        },
        "zh-Hant": {
          translation: zhHant,
        },
      },
    })

export { i18n }
