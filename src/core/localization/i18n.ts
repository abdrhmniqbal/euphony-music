import "intl-pluralrules"

import * as Localization from "expo-localization"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import en from "./resources/en.json"
import { DEFAULT_LANGUAGE_CODE, isSupportedLanguageCode, type LanguageCode } from "./types"

export interface DeviceLocale {
  languageCode?: string | null
  regionCode?: string | null
  scriptCode?: string | null
}

export function getDeviceLanguageCode(
  deviceLocales: readonly DeviceLocale[] = Localization.getLocales()
): LanguageCode {
  const locale = deviceLocales[0]
  const languageCode = locale?.languageCode

  if (languageCode === "zh") {
    const scriptCode = locale?.scriptCode?.toLowerCase()
    const regionCode = locale?.regionCode?.toUpperCase()
    return scriptCode === "hant" || ["HK", "MO", "TW"].includes(regionCode ?? "")
      ? "zh-Hant"
      : "zh-Hans"
  }

  if (languageCode === "pt") {
    return locale?.regionCode?.toUpperCase() === "BR" ? "pt-BR" : DEFAULT_LANGUAGE_CODE
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
        en: {
          translation: en,
        },
      },
    })

export { i18n }
