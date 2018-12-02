const _ = require('underscore')

/**
 * compactObject
 *
 * remove all null and undefined values from the object
 */
module.exports.compactObject = o => {
  let clone = _.clone(o)
  _.each(clone, (v, k) => {
    if(!v) {
      delete clone[k]
    }
  });
  return clone
}

/**
 * isMusicVideo
 *
 * Check a string to decide is it'a music video
 */
module.exports.isMusicVideo = title => {
  // Filters
  const filterMV = /MV|MusicVideo|OfficialVideo|VideoOfficial/gi
  const filterTeaser = /teaser|trailer/gi
  const filterBehindTheScenes = /BehindTheScenes/gi

  const clearTitle = cleanTitle(title)

  return filterMV.test(clearTitle)  // Check for MV or MusicVideo
    && !filterTeaser.test(title) // Check is not Teaser
    && !filterBehindTheScenes.test(title.replace(/\s/g,'')) // Check is not Behind the scenes
}

// Remove spaces, slashes, backslashes and underscores
const cleanTitle = title => title.replace(/\\|\/|\_|\s/gm,'')
module.exports.cleanTitle = cleanTitle
