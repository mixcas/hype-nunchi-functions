const parseDate = require('date-fns/parse')
const dateFns = require('date-fns')

const daysAgeLimit = 30

const isOldTrack = track => dateFns.differenceInDays(new Date(), track.published) >= daysAgeLimit ? true : false

module.exports.isOldTrack = isOldTrack

const cleanOldTracks = tracks => {
  let newChart = {}
  Object.keys(tracks).map( key => {
    if (!isOldTrack(tracks[key])) {
      newChart = Object.assign({}, newChart, {
        [key]: tracks[key],
      })
    }
  })

  return newChart
}
module.exports.cleanOldTracks = cleanOldTracks
