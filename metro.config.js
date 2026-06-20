// Node < 20 compatibility for deps using new array copy helpers.
if (!Array.prototype.toReversed) {
  Object.defineProperty(Array.prototype, "toReversed", {
    value: function toReversed() {
      return this.slice().reverse()
    },
    writable: true,
    configurable: true,
  })
}

const { getDefaultConfig } = require("expo/metro-config")
const { withUniwindConfig } = require("uniwind/metro")
const { withMonicon } = require("@monicon/metro")

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

// Add SQL file support for Drizzle migrations
config.resolver.sourceExts.push("sql")

// Apply uniwind modifications before exporting
const uniwindConfig = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
  dtsFile: "./src/uniwind-types.d.ts",
  extraThemes: [
    "theme-default-light",
    "theme-default-dark",
    "theme-nord-light",
    "theme-nord-dark",
    "theme-dracula-light",
    "theme-dracula-dark",
  ],
})

const moniconConfig = withMonicon(uniwindConfig)

module.exports = moniconConfig
