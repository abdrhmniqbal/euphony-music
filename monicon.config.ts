import { reactNative, clean } from "@monicon/core/plugins";
import { loadLocalCollection } from "@monicon/core/loaders";
import { MoniconConfig } from "@monicon/core";

export default {
  loaders: {
    local: loadLocalCollection("src/assets/icons"),
  },
  plugins: [
    clean({ patterns: ["src/components/icons"] }),
    reactNative({ outputPath: "src/components/icons" }),
  ],
} satisfies MoniconConfig;