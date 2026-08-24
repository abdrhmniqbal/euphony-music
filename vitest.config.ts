import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "expo-file-system": path.resolve(__dirname, "src/__tests__/stubs/expo-file-system.ts"),
      "expo-sqlite/kv-store": path.resolve(
        __dirname,
        "src/__tests__/stubs/expo-sqlite-kv-store.ts"
      ),
      "expo-localization": path.resolve(__dirname, "src/__tests__/stubs/expo-localization.ts"),
      "expo-application": path.resolve(__dirname, "src/__tests__/stubs/expo-application.ts"),
      uniwind: path.resolve(__dirname, "src/__tests__/stubs/uniwind.ts"),
      "react-native": path.resolve(__dirname, "src/__tests__/stubs/react-native.ts"),
    },
  },
  test: {
    globals: true,
    include: ["src/**/__tests__/**/*.test.ts"],
    exclude: ["node_modules", "android", "ios", ".expo"],
    passWithNoTests: true,
    environment: "node",
    testTimeout: 10_000,
    setupFiles: ["src/__tests__/setup.ts"],
  },
})
