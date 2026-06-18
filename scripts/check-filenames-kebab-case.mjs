import fs from "fs/promises"
import path from "path"

const KEBAB_CASE_PATTERN = /^[a-z0-9\-]+(\.[a-z0-9]+)?$/

// Valid Expo Router conventions and exceptional files
const EXCEPTIONS = new Set([
  "_layout.tsx",
  "+html.tsx",
  "+not-found.tsx",
  "+native-intent.tsx",
  "notification.click.tsx",
  "css.d.ts",
  "images.d.ts",
  "jsmediatags.d.ts",
  "json.d.ts",
  "uniwind-types.d.ts",
  "README.md",
])

async function walkDir(dir) {
  let files = []
  const list = await fs.readdir(dir, { withFileTypes: true })
  for (const item of list) {
    if (item.name.startsWith(".")) continue
    const res = path.resolve(dir, item.name)
    if (item.isDirectory()) {
      files = files.concat(await walkDir(res))
    } else {
      files.push(res)
    }
  }
  return files
}

function isValidFilename(filePath) {
  const parts = filePath.split(path.sep)
  
  // Find index of 'src' folder
  const srcIndex = parts.lastIndexOf("src")
  if (srcIndex === -1) return true
  
  // Check each part after 'src'
  for (let i = srcIndex + 1; i < parts.length; i++) {
    const part = parts[i]
    
    if (EXCEPTIONS.has(part)) continue
    if (part.endsWith(".d.ts")) continue
    if (part.endsWith(".sql")) continue
    if (part.endsWith(".json")) continue
    if (part.endsWith(".png")) continue
    
    // Check Expo Router folders: (main), (library), (search)
    if (part.startsWith("(") && part.endsWith(")")) {
      const inner = part.slice(1, -1)
      if (KEBAB_CASE_PATTERN.test(inner)) continue
    }
    
    // Check Expo Router files: [name].tsx, [id].tsx, etc
    if (part.startsWith("[") && part.includes("]")) {
      const inner = part.slice(1, part.indexOf("]"))
      if (KEBAB_CASE_PATTERN.test(inner)) continue
    }
    
    let namePart = part
    // Extract base name without final extension for checking
    if (part.includes(".")) {
      const split = part.split(".")
      // only take the first part, because we forbid dotted suffixes (e.g. name.service.ts -> name.service is invalid)
      namePart = split[0]
      // wait, what if it's name.tsx? it's valid kebab-case. 
      // if it has multiple dots, split[0] gets the primary name, but actually we want to test if the name minus extension is valid.
      // Kebab case allows `my-file.ts` -> name is `my-file`.
      const extIndex = part.lastIndexOf(".")
      namePart = part.slice(0, extIndex)
    }
    
    if (!KEBAB_CASE_PATTERN.test(namePart)) {
      return { valid: false, culprit: part }
    }
  }
  
  return { valid: true, culprit: null }
}

async function main() {
  const srcPath = path.resolve("src")
  try {
    await fs.access(srcPath)
  } catch {
    console.error("No 'src' directory found.")
    process.exit(1)
  }

  const files = await walkDir(srcPath)
  let hasErrors = false

  for (const file of files) {
    const { valid, culprit } = isValidFilename(file)
    if (!valid) {
      console.error(`Invalid filename convention: ${path.relative(process.cwd(), file)} (culprit: '${culprit}')`)
      hasErrors = true
    }
  }

  if (hasErrors) {
    console.error("\nError: All files and directories in 'src' must use kebab-case.")
    process.exit(1)
  }

  console.log("All filenames in 'src' follow kebab-case conventions.")
  process.exit(0)
}

main().catch(console.error)
