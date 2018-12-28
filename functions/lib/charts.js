const parseDate = require('date-fns/parse')
const dateFns = require('date-fns')
const _ = require('underscore')

const daysAgeLimit = 30

const isOldTrack = track => dateFns.differenceInDays(new Date(), track.published) >= daysAgeLimit ? true : false

module.exports.isOldTrack = isOldTrack

const cleanOldTracks = tracks => {
  let cleanTracks = {}
  Object.keys(tracks).map( key => {
    if (!isOldTrack(tracks[key])) {
      cleanTracks = Object.assign({}, cleanTracks, {
        [key]: tracks[key],
      })
    }
  })

  return cleanTracks
}
module.exports.cleanOldTracks = cleanOldTracks

const getDifferenceTracks = (oldTracks, newTracks) => {
  console.log('OLD KEYS', Object.keys(oldTracks))
  console.log('NEW KEYS', Object.keys(newTracks))
  return {
    removed: _.difference(Object.keys(oldTracks), Object.keys(newTracks)),
    added: _.difference(Object.keys(newTracks), Object.keys(oldTracks)),
  }
}
module.exports.getDifferenceTracks = getDifferenceTracks
