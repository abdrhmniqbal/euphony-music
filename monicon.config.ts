import { reactNative, clean } from "@monicon/core/plugins";
import { MoniconConfig } from "@monicon/core";

export default {
  plugins: [
    clean({ patterns: ["src/components/icons"] }),
    reactNative({ outputPath: "src/components/icons" }),
  ],
} satisfies MoniconConfig;