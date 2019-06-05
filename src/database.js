const fs = require('fs')
const Loki = require('lokijs')
const files = require('./files')

const dbFile = files.getCurrentDirectory() + 'database.json'

var events
var db

function initWithFile (filename) {
  if (fs.existsSync(dbFile)) {
    console.log('Clearing previous database')
    fs.unlinkSync(dbFile)
  }
  console.log('Reading file: ' + filename)
  fs.readFile(filename, 'utf8', (err, contents) => {
    if (err) {
      console.log('Error reading file: ' + err)
      return
    }
    console.log('Parsing entries')
    const json = JSON.parse(contents)
    initDatabaseFromJSON(json)
  })
}

function initDatabaseFromJSON (json) {
  console.log('Initializing database -- ' + json.length + ' entries')
  db = db || new Loki(dbFile)
  events = db.addCollection('events')
  const processed = json.reduce((accumulator, event) => {
    events.insert(event)
    return accumulator + 1
  }, 0)
  db.saveDatabase((err) => {
    if (err) {
      console.log('Error saving database: ' + err)
      return
    }
    console.log('Finished loading ' + processed + ' events')
  })
}

function loadExistingDatabase (callback) {
  db = db || new Loki(dbFile)
  db.loadDatabase({}, (err) => {
    if (err) {
      console.log('Error loading existing database: ' + err)
      callback(err)
      return
    }
    exports.events = events = db.getCollection('events')
    callback()
  })
}

exports.initWithFile = initWithFile
exports.loadExistingDatabase = loadExistingDatabase
