const fs = require('fs')
const path = require('path')

module.exports = {
  getCurrentDirectoryBase: () => {
    return path.basename(process.cwd())
  },

  getCurrentDirectory: () => {
    const cwd = process.cwd()
    return path.dirname(cwd) + path.sep + path.basename(cwd) + path.sep
  },

  directoryExists: (filePath) => {
    try {
      return fs.statSync(filePath).isDirectory()
    } catch (err) {
      return false
    }
  }
}
