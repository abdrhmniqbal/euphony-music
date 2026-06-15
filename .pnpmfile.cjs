module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name === "react-native-audio-browser") {
        delete pkg.scripts?.prepare
      }

      return pkg
    },
  },
}
