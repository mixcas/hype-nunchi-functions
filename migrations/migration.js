const fs = require('fs');
const _ = require('underscore')

const db = require('./input.json')

const { cleanOldTracks } = require('../functions/lib/charts.js')

const migrate = (db, version) => {

  const newDB = MIGRATIONS[version](db)

  console.log(newDB)
  fs.writeFile('migrated.json', JSON.stringify(newDB), 'utf8', function (err) {
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
}

migrate(db, 2);
