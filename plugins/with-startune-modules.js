const { withMainApplication } = require("expo/config-plugins")

module.exports = function withStartuneModules(config) {
  return withMainApplication(config, (config) => {
    let src = config.modResults.contents

    if (!src.includes("import com.startune.music.modules.StartuneMusicModulesPackage")) {
      src = src.replace(
        /package com\.[^\n]+/,
        (match) => `${match}\n\nimport com.startune.music.modules.StartuneMusicModulesPackage`
      )
    }

    if (!src.includes("StartuneMusicModulesPackage()")) {
      src = src.replace(
        "val packages = PackageList(this).packages.toMutableList()",
        "val packages = PackageList(this).packages.toMutableList()\n    packages.add(StartuneMusicModulesPackage())"
      )
    }

    config.modResults.contents = src
    return config
  })
}
