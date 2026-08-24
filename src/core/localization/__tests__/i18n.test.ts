import { describe, expect, it } from "vitest"

import { getDeviceLanguageCode, type DeviceLocale } from "../i18n"

function code(locale: DeviceLocale) {
  return getDeviceLanguageCode([locale])
}

describe("getDeviceLanguageCode", () => {
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
    expect(code(locale)).toBe(expected)
  })

  it("maps Chinese by script code", () => {
    expect(code({ languageCode: "zh", scriptCode: "Hans", regionCode: "CN" })).toBe("zh-Hans")
    expect(code({ languageCode: "zh", scriptCode: "Hant", regionCode: "TW" })).toBe("zh-Hant")
  })

  it("maps Chinese regions without script code", () => {
    expect(code({ languageCode: "zh", regionCode: "HK" })).toBe("zh-Hant")
    expect(code({ languageCode: "zh", regionCode: "MO" })).toBe("zh-Hant")
    expect(code({ languageCode: "zh", regionCode: "CN" })).toBe("zh-Hans")
  })

  it("maps Portuguese to pt-BR only for Brazil", () => {
    expect(code({ languageCode: "pt", regionCode: "BR" })).toBe("pt-BR")
    expect(code({ languageCode: "pt", regionCode: "PT" })).toBe("en")
  })

  it("falls back to English for unsupported or missing locales", () => {
    expect(code({ languageCode: "xx", regionCode: "XX" })).toBe("en")
    expect(getDeviceLanguageCode([])).toBe("en")
  })
})
