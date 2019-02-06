const fs = require('fs');
const _ = require('underscore')
const dateFns = require('date-fns')

const db = require('./input.json')

const { cleanOldTracks } = require('../functions/lib/charts.js')

const migrate = (db, version) => {

  const newDB = MIGRATIONS[version](db)

  console.log(newDB)
  fs.writeFile(`migrated_${version}.json`, JSON.stringify(newDB, null, 2), 'utf8', function (err) {
    if (err) {
      console.log('An error occured while writing JSON Object to File.');
      return console.log(err);
    }

    console.log('JSON file has been saved.');
  });
}

const MIGRATIONS = {
  2: db => {
    let transform = {}

    Object.keys(db).forEach( key => {
      const track = db[key]

      if(track.status === 'published') {
        transform[key] = track
      }

    })
    return cleanOldTracks(transform)
  },

  3: db => {
    let transform = {}

    Object.keys(db).forEach( key => {
      const track = db[key]

      const { published, updated } = track
      transform[key] = track


      if(published.length === 10) {
        transform[key].published = dateFns.format(published * 1000)
      }

      if(updated.length === 10) {
        transform[key].updated = dateFns.format(updated * 1000)
      }

    })
    return transform
  },
}

migrate(db, 3);
