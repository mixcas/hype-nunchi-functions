const assert = require('assert')
const dateFns = require('date-fns')

const { cleanOldTracks } =  require('../lib/charts')

describe('Utils', function() {
  describe('cleanOldTracks', function() {
    it('should remove 2 old tracks', function() {
      const testValue = {
        newTrack : {
          published: new Date()
        },
        notSoNew: {
          published: dateFns.subDays(new Date(), 15)
        },
        oldTrack: {
          published: dateFns.subDays(new Date(), 30)
        },
        olderTrack: {
          published: dateFns.subDays(new Date(), 60)
        }
      }

      assert.equal(Object.keys(testValue).length - 2, Object.keys(cleanOldTracks(testValue)).length)
    })

    it('should not remove tracks ', function() {
      const testValue = {
        newTrack : {
          published: new Date()
        },
        notSoNew: {
          published: dateFns.subDays(new Date(), 7)
        },
        oldTrack: {
          published: dateFns.subDays(new Date(), 14)
        },
        olderTrack: {
          published: dateFns.subDays(new Date(), 21)
        }
      }

      assert.equal(Object.keys(testValue).length, Object.keys(cleanOldTracks(testValue)).length)
    })
  })
})
