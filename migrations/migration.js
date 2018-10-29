const fs = require('fs');
const _ = require('underscore')

const db = require('./input.json')

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
  1: db => {
    const tracks = db.tracks;

    let transform = {}

    Object.keys(tracks).forEach( key => {
      const track = tracks[key];

      let status = 'unpublished'

      const filter = /MV|M\V|M\/V|Music Video/g

      if(filter.test(track.title)) {
        status = 'published'
      }


      transform[key] = Object.assign(
        {},
        _.omit(track, 'draft', 'public'),
        {
          status,
        }
      )
    })

    return Object.assign(
      {},
      db,
      {
        'tracks': transform,
      },
    )
  },
}

migrate(db, 1);
