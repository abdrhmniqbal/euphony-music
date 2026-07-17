import { defineConfig } from "vitest/config"
import { reactNative } from "vitest-native"
import path from "path"

export default defineConfig({
  plugins: [reactNative({ engine: "mock" })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "android", "ios", ".expo"],
    testTimeout: 10_000,
    setupFiles: ["src/__tests__/setup.ts"],
    server: {
      deps: {
        inline: ["vitest-native", "expo-sqlite", "drizzle-orm"],
      },
    },
  },
})
