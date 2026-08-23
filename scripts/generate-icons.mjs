import { readdir, readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"

const ICONS_DIR = "src/assets/icons"
const OUTPUT_DIR = "src/components/icons/local"

function toComponentName(fileName) {
  const base = fileName.replace(/\.svg$/, "")
  const pascal = base
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
  return `Local${pascal}Icon`
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })
  const files = (await readdir(ICONS_DIR)).filter((f) => f.endsWith(".svg"))

  for (const file of files) {
    const xml = await readFile(path.join(ICONS_DIR, file), "utf8")
    const name = toComponentName(file)
    const componentName = name
    const source = `import React from "react";
import { SvgXml, type SvgProps } from "react-native-svg";

const ${componentName} = (props: Omit<SvgProps, "xml">) => {
  const xml = \`${xml.trim()}\`;

  return <SvgXml xml={xml} {...props} />;
};

export default ${componentName};
`
    const outFile = path.join(OUTPUT_DIR, file.replace(/\.svg$/, ".tsx"))
    await writeFile(outFile, source)
  }

  console.log(`Generated ${files.length} icons into ${OUTPUT_DIR}`)
}

main()
