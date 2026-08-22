/**
 * Purpose: Loads, validates, and persists the selected app language.
 * Caller: Localization provider and language settings route.
 * Dependencies: i18next readiness, settings repository, localization type guards, settings store.
 * Main Functions: initLocalization(), setLanguageCode(), getLanguageOptions().
 * Side Effects: Reads/writes language settings JSON and changes the active i18next language.
 */

import {
  i18n,
  i18nReady,
  DEFAULT_LANGUAGE_CODE,
  getDeviceLanguageCode,
  isSupportedLanguageCode,
} from "./i18n"
import type { LanguageCode, LanguageOption } from "./types"
import {
  createSettingsConfigFile,
  loadSettingsConfig,
  saveSettingsConfig,
} from "@/modules/settings/repository"
import { updateSettingsState } from "@/modules/settings/store"

interface LanguageConfig {
  languageCode: LanguageCode
}

const LANGUAGE_SETTINGS_FILE = createSettingsConfigFile("language.json")

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: "en",
    labelKey: "settings.language.english",
    nativeLabelKey: "settings.language.englishNative",
  },
  {
    code: "id",
    labelKey: "settings.language.indonesian",
    nativeLabelKey: "settings.language.indonesianNative",
  },
  {
    code: "hi",
    labelKey: "settings.language.hindi",
    nativeLabelKey: "settings.language.hindiNative",
  },
  {
    code: "zh-Hans",
    labelKey: "settings.language.chineseSimplified",
    nativeLabelKey: "settings.language.chineseSimplifiedNative",
  },
  {
    code: "zh-Hant",
    labelKey: "settings.language.chineseTraditional",
    nativeLabelKey: "settings.language.chineseTraditionalNative",
  },
  {
    code: "ja",
    labelKey: "settings.language.japanese",
    nativeLabelKey: "settings.language.japaneseNative",
  },
  {
    code: "ru",
    labelKey: "settings.language.russian",
    nativeLabelKey: "settings.language.russianNative",
  },
  {
    code: "de",
    labelKey: "settings.language.german",
    nativeLabelKey: "settings.language.germanNative",
  },
  {
    code: "fr",
    labelKey: "settings.language.french",
    nativeLabelKey: "settings.language.frenchNative",
  },
  {
    code: "ko",
    labelKey: "settings.language.korean",
    nativeLabelKey: "settings.language.koreanNative",
  },
  {
    code: "it",
    labelKey: "settings.language.italian",
    nativeLabelKey: "settings.language.italianNative",
  },
  {
    code: "es",
    labelKey: "settings.language.spanish",
    nativeLabelKey: "settings.language.spanishNative",
  },
  {
    code: "nl",
    labelKey: "settings.language.dutch",
    nativeLabelKey: "settings.language.dutchNative",
  },
  {
    code: "pt-BR",
    labelKey: "settings.language.portugueseBrazil",
    nativeLabelKey: "settings.language.portugueseBrazilNative",
  },
]

let initPromise: Promise<void> | null = null

function sanitizeConfig(config: unknown): LanguageConfig {
  const source = config && typeof config === "object" ? (config as Record<string, unknown>) : {}

  return {
    languageCode: isSupportedLanguageCode(source.languageCode)
      ? source.languageCode
      : getDeviceLanguageCode(),
  }
}

async function applyLanguage(languageCode: LanguageCode): Promise<void> {
  await i18nReady
  if (i18n.language !== languageCode) {
    await i18n.changeLanguage(languageCode)
  }
}

export function getLanguageOptions(): LanguageOption[] {
  return LANGUAGE_OPTIONS
}

export function initLocalization(): Promise<void> {
  if (initPromise) return initPromise

  initPromise = loadSettingsConfig(
    LANGUAGE_SETTINGS_FILE,
    { languageCode: getDeviceLanguageCode() },
    sanitizeConfig
  ).then(async (config) => {
    updateSettingsState({ languageCode: config.languageCode })
    await applyLanguage(config.languageCode)
  })

  return initPromise
}

export async function setLanguageCode(languageCode: LanguageCode): Promise<LanguageCode> {
  const next = isSupportedLanguageCode(languageCode) ? languageCode : DEFAULT_LANGUAGE_CODE
  updateSettingsState({ languageCode: next })
  await applyLanguage(next)
  await saveSettingsConfig(LANGUAGE_SETTINGS_FILE, { languageCode: next })
  return next
}
