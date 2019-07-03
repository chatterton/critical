#!/usr/bin/env node

const files = require('./src/files')
const cmd = require('commander')
const database = require('./src/database')
const entities = require('html-entities').AllHtmlEntities

cmd
  .version('0.0.1', '-v, --version')
  .option('-i, --init <filename>', 'initialize internal database from saved website json')
  .option('-s, --search <string>', 'full text search')
  .option('-r, --rating <string>', 'return only events with this rating -- G, PG, PG-13, R, or X')
  .option('--csv', 'return in CSV format instead of text')
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
    if(!cmd.csv) {
      console.log('loaded ' + database.events.count() + ' events')
    }
    if (cmd.search) {
      var finder = database.events
        .chain()
        .find({
          '$or': [
            { 'description': { '$regex': [cmd.search, 'i'] } },
            { 'title': { '$regex': [cmd.search, 'i'] } },
            { 'venue.venue': { '$regex': [cmd.search, 'i'] } }
          ]
        })
      if (cmd.rating) {
        finder = finder.find( { 'venue.address': { '$regex': ['Rating: '+cmd.rating, 'i'] } } )
      }
      finder = finder.simplesort('start_date')

      const found = finder.data()
      if (found.length > 0) {
        if (!cmd.csv) {
          console.log('found: ' + found.length)
        }
        doOutput(found)
      } else {
        console.log('nothing found')
      }
    }
  })
}

const timeFormat = {
  hour12: false,
  hour: '2-digit',
  minute: '2-digit'
}

function doOutput (found) {
  if (cmd.csv) {
    doCSVOutput(found)
    return
  }

  const humanDateFormat = {
    weekday: 'short',
    month: 'long',
    day: '2-digit'
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
      entities.decode(event.title) +
      ' @ ' +
      entities.decode(event.venue.venue)
    )
  })
}

function doCSVOutput (found) {
  const weekdayFormat = { weekday: 'long' }
  const dateFormat = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }

  function csvEscape(string) {
    const decoded = entities.decode(string).replace('"','\'')
    return '"'+decoded+'"'
  }

  // header
  console.log('Title,Rating,Day,Date,Start,End,Location,Description')

  // items
  found.map((event) => {
    var rating = ''
    if (event.venue.address) {
      var [_, actualRating] = event.venue.address.split(' Rating: ')
      rating = actualRating.replace(' (Red Light)','')
    } else {
      rating = ''
    }
    const start = new Date(event.start_date)
    const end = new Date(event.end_date)

    console.log(
      csvEscape(event.title) + ',' +
      rating + ',' +
      start.toLocaleDateString('en-US', weekdayFormat) + ',' +
      start.toLocaleDateString('en-US', dateFormat) + ',' +
      start.toLocaleTimeString('en-US', timeFormat) + ',' +
      end.toLocaleTimeString('en-US', timeFormat) + ',' +
      csvEscape(event.venue.venue) + ',' +
      csvEscape(event.description.replace(/<[^>]+>/g, '')) // i.e. this has <p> tags in it, boo
    )
  })
}

