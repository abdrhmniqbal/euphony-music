import assert from "node:assert/strict"
import { describe, it } from "vitest"

const { withStartuneModulesRegistration } = require("../../plugins/with-startune-modules.js")

const IMPORT_LINE = "import com.startune.music.modules.StartuneMusicModulesPackage"
const PACKAGE_CALL = "StartuneMusicModulesPackage()"

describe("with-startune-modules", () => {
  it("registers Startune modules in the current Expo MainApplication shape", () => {
    const output = withStartuneModulesRegistration(`package com.startune.music

import android.app.Application

class MainApplication : Application(), ReactApplication {
  override val reactHost: ReactHost by lazy {
    ExpoReactHostFactory.getDefaultReactHost(
      context = applicationContext,
      packageList = PackageList(this).packages
    )
  }
}
`)

    assert.match(output, new RegExp(escapeRegExp(IMPORT_LINE)))
    assert.match(
      output,
      new RegExp(`packageList = PackageList\\(this\\)\\.packages \\+ ${escapeRegExp(PACKAGE_CALL)}`)
    )
  })

  it("keeps an existing mutable package list registration idempotent", () => {
    const input = `package com.startune.music

${IMPORT_LINE}

class MainApplication : Application(), ReactApplication {
  override val reactHost: ReactHost by lazy {
    val packages = PackageList(this).packages.toMutableList()
    packages.add(${PACKAGE_CALL})
    ExpoReactHostFactory.getDefaultReactHost(
      context = applicationContext,
      packageList = packages
    )
  }
}
`

    assert.equal(withStartuneModulesRegistration(input), input)
  })
})

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
