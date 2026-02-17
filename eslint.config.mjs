import path from "node:path"
import process from "node:process"
import antfu from "@antfu/eslint-config"
import expo from "eslint-plugin-expo"
import tailwind from "eslint-plugin-tailwindcss"

export default antfu({
  react: true,
  imports: false,
  formatters: true,
  plugins: {
    expo,
    tailwindcss: tailwind,
  },
  // android/app/build/intermediates/assets/debug/EXDevMenuApp.android.js
  ignores: ["android/app/build"],
  settings: {
    tailwindcss: {
      callees: ["cn", "cva"],
      config: path.join(process.cwd(), "src/global.css"),
    },
  },
  rules: {
    "expo/use-dom-exports": ["error"],
    "expo/no-env-var-destructuring": ["error"],
    "expo/no-dynamic-env-var": ["error"],
    "tailwindcss/no-custom-classname": ["off"],
    "tailwindcss/classnames-order": ["error"],
  },
})
