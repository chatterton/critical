#!/usr/bin/env node

const files = require('./src/files')
const cmd = require('commander')
const database = require('./src/database')

console.log('Critical Northwest events parser in ' + files.getCurrentDirectory())

cmd
  .version('0.0.1', '-v, --version')
  .option('-i, --init <filename>', 'initialize internal database from saved website json')
  .option('-s, --search <string>', 'full text search')
  .parse(process.argv)

// Automatically display help if no arguments
if (!process.argv.slice(2).length) {
  cmd.outputHelp()
}

// Process website json if needed, and exit
if (cmd.init) {
  database.initWithFile(cmd.init)
} else {
  // All other functionality happens with existing database
  database.loadExistingDatabase((err) => {
    console.log("ok: "+database.getEvents().count())
  })
}
