const assert = require('assert')

const { getDifferenceTracks } =  require('../lib/charts')

describe('Utils', function() {
  describe('getDifferenceTracks', function() {
    it('should return the difference between the object keys', function() {
      const oldTracks = {
        'removed1': 1,
        'removed2': 2,
        'removed3': 3,
        '4': 4,
        '5': 5,
        '6': 6,
      }

      const newTracks = {
        '4': 4,
        '5': 5,
        '6': 6,
        'added7': 7,
        'added8': 8,
        'added9': 9,
      }

      assert.deepEqual({
        added: [
          'added7',
          'added8',
          'added9',
        ],
        removed: [
          'removed1',
          'removed2',
          'removed3',
        ]
      }, getDifferenceTracks(oldTracks, newTracks))
    })
  })
})
