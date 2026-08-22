import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  locales: [] as Array<Record<string, string | undefined>>,
}))

vi.mock("expo-localization", () => ({
  getLocales: () => mocks.locales,
}))

import { getDeviceLanguageCode } from "../i18n"

function deviceLocale(languageTag: Record<string, string | undefined>) {
  mocks.locales = [languageTag]
}

describe("getDeviceLanguageCode", () => {
  beforeEach(() => {
    deviceLocale({ languageCode: "en", regionCode: "US" })
  })

  it.each([
    [{ languageCode: "en", regionCode: "US" }, "en"],
    [{ languageCode: "id", regionCode: "ID" }, "id"],
    [{ languageCode: "hi", regionCode: "IN" }, "hi"],
    [{ languageCode: "ja", regionCode: "JP" }, "ja"],
    [{ languageCode: "ru", regionCode: "RU" }, "ru"],
    [{ languageCode: "de", regionCode: "DE" }, "de"],
    [{ languageCode: "fr", regionCode: "FR" }, "fr"],
    [{ languageCode: "ko", regionCode: "KR" }, "ko"],
    [{ languageCode: "it", regionCode: "IT" }, "it"],
    [{ languageCode: "es", regionCode: "ES" }, "es"],
    [{ languageCode: "nl", regionCode: "NL" }, "nl"],
  ])("maps %s to %s", (locale, expected) => {
    deviceLocale(locale)
    expect(getDeviceLanguageCode()).toBe(expected)
  })

  it("maps Chinese by script code", () => {
    deviceLocale({ languageCode: "zh", scriptCode: "Hans", regionCode: "CN" })
    expect(getDeviceLanguageCode()).toBe("zh-Hans")

    deviceLocale({ languageCode: "zh", scriptCode: "Hant", regionCode: "TW" })
    expect(getDeviceLanguageCode()).toBe("zh-Hant")
  })

  it("maps Chinese regions without script code", () => {
    deviceLocale({ languageCode: "zh", regionCode: "HK" })
    expect(getDeviceLanguageCode()).toBe("zh-Hant")

    deviceLocale({ languageCode: "zh", regionCode: "MO" })
    expect(getDeviceLanguageCode()).toBe("zh-Hant")

    deviceLocale({ languageCode: "zh", regionCode: "CN" })
    expect(getDeviceLanguageCode()).toBe("zh-Hans")
  })

  it("maps Portuguese to pt-BR only for Brazil", () => {
    deviceLocale({ languageCode: "pt", regionCode: "BR" })
    expect(getDeviceLanguageCode()).toBe("pt-BR")

    deviceLocale({ languageCode: "pt", regionCode: "PT" })
    expect(getDeviceLanguageCode()).toBe("en")
  })

  it("falls back to English for unsupported or missing locales", () => {
    deviceLocale({ languageCode: "xx", regionCode: "XX" })
    expect(getDeviceLanguageCode()).toBe("en")

    mocks.locales = []
    expect(getDeviceLanguageCode()).toBe("en")
  })
})
