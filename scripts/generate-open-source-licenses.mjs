/**
 * Purpose: Generates bundled open-source license metadata JSON from direct runtime dependencies only.
 * Caller: Manual development script via package.json.
 * Dependencies: Node.js fs/path modules, root package.json, and installed direct dependency package manifests.
 * Main Functions: generateOpenSourceLicenses()
 * Side Effects: Reads package metadata/license files and writes src/assets/open-source-licenses.json.
 */

import { promises as fs } from "node:fs"
import path from "node:path"

const PROJECT_ROOT = process.cwd()
const NODE_MODULES_DIR = path.join(PROJECT_ROOT, "node_modules")
const ROOT_PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, "package.json")
const OUTPUT_PATH = path.join(PROJECT_ROOT, "src", "assets", "open-source-licenses.json")

const LICENSE_FILE_CANDIDATES = [
  "LICENSE",
  "LICENSE.md",
  "LICENSE.txt",
  "LICENCE",
  "LICENCE.md",
  "LICENCE.txt",
  "COPYING",
  "COPYING.md",
  "COPYING.txt",
]

function normalizeRepository(repository) {
  if (!repository) {
    return ""
  }

  const raw =
    typeof repository === "string"
      ? repository
      : typeof repository === "object" && typeof repository.url === "string"
        ? repository.url
        : ""

  if (!raw) {
    return ""
  }

  if (/^[^/\s]+\/[^/\s]+$/.test(raw)) {
    return `https://github.com/${raw}`
  }

  return raw.replace(/^git\+/, "").replace(/\.git$/, "")
}

function normalizeLicenses(packageJson) {
  if (typeof packageJson.license === "string") {
    return packageJson.license
  }

  if (Array.isArray(packageJson.licenses)) {
    return packageJson.licenses
      .map((entry) =>
        typeof entry === "string" ? entry : typeof entry?.type === "string" ? entry.type : ""
      )
      .filter(Boolean)
      .join(", ")
  }

  if (
    packageJson.license &&
    typeof packageJson.license === "object" &&
    typeof packageJson.license.type === "string"
  ) {
    return packageJson.license.type
  }

  return ""
}

async function readLicenseText(packageDir) {
  for (const fileName of LICENSE_FILE_CANDIDATES) {
    const filePath = path.join(packageDir, fileName)
    try {
      const stat = await fs.stat(filePath)
      if (!stat.isFile()) {
        continue
      }

      return await fs.readFile(filePath, "utf8")
    } catch {}
  }

  return ""
}

async function getDirectDependencyNames() {
  const raw = await fs.readFile(ROOT_PACKAGE_JSON_PATH, "utf8")
  const packageJson = JSON.parse(raw)
  const dependencies = packageJson?.dependencies

  if (!dependencies || typeof dependencies !== "object") {
    return []
  }

  return Object.keys(dependencies)
}

async function resolvePackageDir(packageName) {
  if (packageName.startsWith("@")) {
    const [scope, name] = packageName.split("/")
    if (!scope || !name) {
      return null
    }
    return path.join(NODE_MODULES_DIR, scope, name)
  }

  return path.join(NODE_MODULES_DIR, packageName)
}

async function generateOpenSourceLicenses() {
  const dependencyNames = await getDirectDependencyNames()
  const packages = new Map()

  for (const dependencyName of dependencyNames) {
    try {
      const packageDir = await resolvePackageDir(dependencyName)
      if (!packageDir) {
        continue
      }
      const packageJsonPath = path.join(packageDir, "package.json")
      const raw = await fs.readFile(packageJsonPath, "utf8")
      const packageJson = JSON.parse(raw)
      if (
        !packageJson ||
        typeof packageJson.name !== "string" ||
        typeof packageJson.version !== "string"
      ) {
        continue
      }

      const uniqueKey = `${packageJson.name}@${packageJson.version}`
      if (packages.has(uniqueKey)) {
        continue
      }

      const licenseText = await readLicenseText(packageDir)

      packages.set(uniqueKey, {
        name: packageJson.name,
        version: packageJson.version,
        repository: normalizeRepository(packageJson.repository),
        licenses: normalizeLicenses(packageJson),
        licenseText,
      })
    } catch {}
  }

  const sorted = [...packages.values()].sort((left, right) => {
    const nameOrder = left.name.localeCompare(right.name, undefined, {
      sensitivity: "base",
    })
    if (nameOrder !== 0) {
      return nameOrder
    }

    return left.version.localeCompare(right.version, undefined, {
      sensitivity: "base",
    })
  })

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf8")
  console.log(
    `Generated ${sorted.length} license entries at ${path.relative(PROJECT_ROOT, OUTPUT_PATH)}`
  )
}

await generateOpenSourceLicenses()
