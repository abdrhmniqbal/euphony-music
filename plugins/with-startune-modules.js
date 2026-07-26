const { withMainApplication } = require("expo/config-plugins")

const IMPORT_LINE = "import com.startune.music.modules.StartuneMusicModulesPackage"
const PACKAGE_CALL = "StartuneMusicModulesPackage()"

module.exports = function withStartuneModules(config) {
  return withMainApplication(config, (config) => {
    config.modResults.contents = withStartuneModulesRegistration(config.modResults.contents)
    return config
  })
}

module.exports.withStartuneModulesRegistration = withStartuneModulesRegistration

function withStartuneModulesRegistration(src) {
  if (!src.includes(IMPORT_LINE)) {
    src = insertImport(src)
  }

  if (!src.includes(PACKAGE_CALL)) {
    src = insertPackage(src)
  }

  return src
}

function insertImport(src) {
  const next = src.replace(/^package\s+[\w.]+/m, (match) => `${match}\n\n${IMPORT_LINE}`)
  if (next === src) {
    throw new Error("Could not add StartuneMusicModulesPackage import to MainApplication.kt")
  }
  return next
}

function insertPackage(src) {
  const mutablePackages = /^(\s*)val packages = PackageList\(this\)\.packages\.toMutableList\(\)$/m
  if (mutablePackages.test(src)) {
    return src.replace(mutablePackages, `$&\n$1packages.add(${PACKAGE_CALL})`)
  }

  const packageListValue = /^(\s*)val packages = PackageList\(this\)\.packages$/m
  if (packageListValue.test(src)) {
    return src.replace(
      packageListValue,
      `$1val packages = PackageList(this).packages.toMutableList()\n$1packages.add(${PACKAGE_CALL})`
    )
  }

  const inlineHostPackageList = /(\s*)packageList = PackageList\(this\)\.packages\b/m
  if (inlineHostPackageList.test(src)) {
    return src.replace(
      inlineHostPackageList,
      `$1packageList = PackageList(this).packages + ${PACKAGE_CALL}`
    )
  }

  const returnPackageList = /^(\s*)return PackageList\(this\)\.packages$/m
  if (returnPackageList.test(src)) {
    return src.replace(returnPackageList, `$1return PackageList(this).packages + ${PACKAGE_CALL}`)
  }

  throw new Error("Could not register StartuneMusicModulesPackage in MainApplication.kt")
}
