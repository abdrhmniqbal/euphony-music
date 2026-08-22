export type LanguageCode =
  | "en"
  | "id"
  | "hi"
  | "zh-Hans"
  | "zh-Hant"
  | "ja"
  | "ru"
  | "de"
  | "fr"
  | "ko"
  | "it"
  | "es"
  | "nl"
  | "pt-BR"

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
