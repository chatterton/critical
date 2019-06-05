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
    if (err) { /* handled upstream */ return }
    console.log('loaded ' + database.events.count() + ' events')
    if (cmd.search) {
      const found = database.events
        .chain()
        .find({
          '$or': [
            { 'description': { '$regex': [cmd.search, 'i'] } },
            { 'title': { '$regex': [cmd.search, 'i'] } },
            { 'location': { '$regex': [cmd.search, 'i'] } },
            { 'author': { '$regex': [cmd.search, 'i'] } }
          ] }
        )
        .simplesort('start_date')
        .data()
      if (found.length > 0) {
        console.log('found: ' + found.length)
        doOutput(found)
      } else {
        console.log('nothing found')
      }
    }
  })
}

function doOutput (found) {
  const humanDateFormat = {
    weekday: 'short',
    month: 'long',
    day: '2-digit'
  }
  const timeFormat = {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  }
  found.map((event) => {
    const start = new Date(event.start_date)
    const end = new Date(event.end_date)
    console.log(
      start.toLocaleDateString('en-US', humanDateFormat) +
      ', ' +
      start.toLocaleTimeString('en-US', timeFormat) +
      ' to ' +
      end.toLocaleTimeString('en-US', timeFormat) +
      ' - ' +
      event.title
    )
  })
}
