const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add SQL file support for Drizzle migrations
config.resolver.sourceExts.push('sql');

// Apply uniwind modifications before exporting
const uniwindConfig = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
  dtsFile: "./src/uniwind-types.d.ts",
});

module.exports = uniwindConfig;
