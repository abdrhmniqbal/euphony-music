import { MoniconConfig } from "@monicon/core"
import { loadLocalCollection } from "@monicon/core/loaders"
import { clean, reactNative } from "@monicon/core/plugins"

export default {
  loaders: {
    local: loadLocalCollection("src/assets/icons"),
  },
  plugins: [
    clean({ patterns: ["src/components/icons"] }),
    reactNative({ outputPath: "src/components/icons" }),
  ],
} satisfies MoniconConfig
